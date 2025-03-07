const { Message, Thread, DirectMessage } = require("../model/messageModel.js");
const UserDetails = require("../model/User.js")
const uploadMedia = require("../utils/uploadMedia.js");
const { io, getReceiverSocketId } = require("../socket/socket.js");

const setupSocketEvents = () => {
    io.on("connection", (socket) => {
        // **1. Send Message (Text or Media)**
        socket.on("sendMessage", async ({ sender, receiver, content, file }) => {
            try {
                // Validate input parameters
                if (!sender || !receiver) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Sender and receiver IDs are required"
                    });
                }

                // Check if users exist
                const isUsersExist = await UserDetails.findByIds([sender, receiver]);
                if (isUsersExist.length !== 2) {
                    return socket.emit("error", {
                        type: "USER_NOT_FOUND",
                        message: "One or both users do not exist",
                        details: {
                            sender: sender,
                            receiver: receiver,
                            foundUsers: isUsersExist.length
                        }
                    });
                }

                // Validate message content
                if (!content && !file) {
                    return socket.emit("error", {
                        type: "EMPTY_MESSAGE",
                        message: "Message must contain either text content or a file"
                    });
                }

                // Handle media upload
                let media = [];
                if (file) {
                    try {
                        const mediaURL = await uploadMedia(file);
                        if (mediaURL) {
                            media.push({
                                url: mediaURL,
                                type: file.mimetype.split("/")[0],
                                format: file.mimetype.split("/")[1]
                            });
                        }
                    } catch (uploadError) {
                        return socket.emit("error", {
                            type: "MEDIA_UPLOAD_ERROR",
                            message: "Failed to upload media",
                            details: uploadError.message
                        });
                    }
                }

                // Create message
                const message = new Message({
                    sender,
                    receiver,
                    content,
                    media
                });

                // Check for existing chat or create new one
                try {
                    let chat = await DirectMessage.findOne({
                        participants: { $all: [sender, receiver] }
                    });

                    if (chat) {
                        chat.messages.push(message._id);
                        await chat.save();
                    } else {
                        chat = new DirectMessage({
                            participants: [sender, receiver],
                            messages: [message._id]
                        });
                        await chat.save();
                    }

                    // Save message
                    await message.save();

                    // Emit message to receiver
                    const receiverSocketId = getReceiverSocketId(receiver);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit("receiveMessage", message);
                    }

                    // Confirm message sent to sender
                    socket.emit("messageSent", message);

                } catch (chatError) {
                    // Rollback message creation if chat handling fails
                    await Message.findByIdAndDelete(message._id);

                    return socket.emit("error", {
                        type: "CHAT_HANDLING_ERROR",
                        message: "Failed to handle chat or message storage",
                        details: chatError.message
                    });
                }

            } catch (error) {
                // Catch any unexpected errors
                console.error("Unexpected error in sendMessage:", error);

                socket.emit("error", {
                    type: "UNEXPECTED_ERROR",
                    message: "An unexpected error occurred while sending message",
                    details: error.message
                });
            }
        });

        // **2. Delete Message**
        socket.on("deleteMessage", async ({ messageId, userId }) => {
            try {
                // Validate input
                if (!messageId) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Message ID is required",
                        details: "No message ID provided for deletion"
                    });
                }

                // Check if message exists
                const message = await Message.findById(messageId);
                if (!message) {
                    return socket.emit("error", {
                        type: "NOT_FOUND",
                        message: "Message not found",
                        details: `No message found with ID: ${messageId}`
                    });
                }

                // Verify user's permission to delete (optional, based on your authorization logic)
                if (message.sender.toString() !== userId) {
                    return socket.emit("error", {
                        type: "UNAUTHORIZED",
                        message: "You are not authorized to delete this message",
                        details: `User ${userId} does not have permission to delete message ${messageId}`
                    });
                }

                // Delete from DirectMessage
                await DirectMessage.findOneAndUpdate(
                    { messages: messageId },
                    { $pull: { messages: messageId } }
                );

                // Delete the message
                await Message.findByIdAndDelete(messageId);

                // Emit deletion event
                io.emit("messageDeleted", messageId);
            } catch (error) {
                console.error("Error deleting message:", error);
                socket.emit("error", {
                    type: "UNEXPECTED_ERROR",
                    message: "An unexpected error occurred while deleting message",
                    details: error.message
                });
            }
        });

        // **3. Update Message**
        socket.on("updateMessage", async ({ messageId, newContent, userId }) => {
            try {
                // Validate input
                if (!messageId) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Message ID is required",
                        details: "No message ID provided for update"
                    });
                }

                if (!newContent) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "New content is required",
                        details: "Cannot update message with empty content"
                    });
                }

                // Check if message exists
                const existingMessage = await Message.findById(messageId);
                if (!existingMessage) {
                    return socket.emit("error", {
                        type: "NOT_FOUND",
                        message: "Message not found",
                        details: `No message found with ID: ${messageId}`
                    });
                }

                // Verify user's permission to update (optional, based on your authorization logic)
                if (existingMessage.sender.toString() !== userId) {
                    return socket.emit("error", {
                        type: "UNAUTHORIZED",
                        message: "You are not authorized to update this message",
                        details: `User ${userId} does not have permission to update message ${messageId}`
                    });
                }

                // Update message
                const updatedMessage = await Message.findByIdAndUpdate(
                    messageId,
                    {
                        content: newContent,
                        updatedAt: new Date() // Optional: track update timestamp
                    },
                    { new: true }
                );

                // Emit update event
                io.emit("messageUpdated", updatedMessage);
            } catch (error) {
                console.error("Error updating message:", error);
                socket.emit("error", {
                    type: "UNEXPECTED_ERROR",
                    message: "An unexpected error occurred while updating message",
                    details: error.message
                });
            }
        });

        // **4. Get All Messages**
        socket.on("getMessages", async ({
            chatId,
            userId,
            limit = 50,  // Default limit
            next = null  // Cursor for pagination
        }) => {
            try {
                // Validate input
                if (!chatId) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Chat ID is required",
                        details: "No chat ID provided to fetch messages"
                    });
                }

                if (!userId) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "User ID is required",
                        details: "No user ID provided to fetch messages"
                    });
                }

                // Validate limit
                if (limit <= 0 || limit > 100) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Invalid limit",
                        details: "Limit must be between 1 and 100"
                    });
                }

                // Check if user exists
                const userExists = await UserDetails.findById(userId);
                if (!userExists) {
                    return socket.emit("error", {
                        type: "NOT_FOUND",
                        message: "User not found",
                        details: `No user found with ID: ${userId}`
                    });
                }

                // Check if chat exists and user is a participant
                const chat = await DirectMessage.findById(chatId);
                if (!chat) {
                    return socket.emit("error", {
                        type: "NOT_FOUND",
                        message: "Chat not found",
                        details: `No chat found with ID: ${chatId}`
                    });
                }

                // Verify user is a participant in the chat
                const isParticipant = chat.participants.some(
                    participant => participant.toString() === userId
                );
                if (!isParticipant) {
                    return socket.emit("error", {
                        type: "UNAUTHORIZED",
                        message: "You are not a participant in this chat",
                        details: `User ${userId} is not in chat ${chatId}`
                    });
                }

                // Prepare query for pagination
                const query = next
                    ? { _id: { $lt: next } }  // If next cursor exists, fetch messages older than the cursor
                    : {};

                // Fetch messages with pagination
                const messages = await Message.find({
                    ...query,
                    parentThread: chatId  // Assuming parentThread references the chat
                })
                    .populate('sender', 'username email profilePicture')
                    .populate('receiver', 'username email profilePicture')
                    .sort({ timestamp: -1 })  // Sort by most recent first
                    .limit(limit + 1);  // Fetch one extra to determine if there are more messages

                // Determine if there are more messages
                const hasMore = messages.length > limit;
                const processedMessages = hasMore ? messages.slice(0, limit) : messages;

                // Prepare next cursor (ID of the last message in this batch)
                const nextCursor = hasMore
                    ? messages[limit - 1]._id
                    : null;

                // Emit paginated messages
                socket.emit("messagesPaginated", {
                    messages: processedMessages,
                    hasMore,
                    nextCursor
                });
            } catch (error) {
                console.error("Error fetching messages:", error);
                socket.emit("error", {
                    type: "UNEXPECTED_ERROR",
                    message: "An unexpected error occurred while fetching messages",
                    details: error.message
                });
            }
        });

        // **5. Create Thread**
        socket.on("createThread", async ({ creator, title, participants }) => {
            try {
                if (!creator || !title) {
                    return socket.emit("error", { message: "creator, title are required.", type: "NOT_FOUND", details: "creator or title not found." });
                }
                const thread = new Thread({ creator, title, participants });
                await thread.save();
                io.emit("threadCreated", thread);
            } catch (error) {
                console.error("Error creating thread:", error);
                socket.emit("error", {
                    type: "UNEXPECTED_ERROR",
                    message: "An unexpected error occurred while creating thread",
                    details: error.message
                });
            }
        });

        // **6. Reply to a Thread**
        socket.on("replyToThread", async ({ threadId, sender, content, file }) => {
            try {
                // Check if thread exists first
                const thread = await Thread.findById(threadId);
                if (!thread) {
                    return socket.emit("error", { message: "Thread not found", type: "THREAD_NOT_FOUND" });
                }

                let media = [];
                if (file) {
                    try {
                        const mediaURL = await uploadMedia(file);
                        if (mediaURL) {
                            media.push({
                                url: mediaURL,
                                type: file.mimetype.split("/")[0],
                                format: file.mimetype.split("/")[1]
                            });
                        }
                    } catch (mediaError) {
                        return socket.emit("error", { message: "Failed to upload media", type: "MEDIA_UPLOAD_FAILED", details: mediaError.message });
                    }
                }

                const message = new Message({
                    sender,
                    content,
                    media,
                    parentThread: threadId
                });

                await message.save();
                await Thread.findByIdAndUpdate(
                    threadId,
                    { $push: { messages: message._id } }
                );
                io.emit("threadReplyAdded", { threadId, message });
            } catch (error) {
                console.error("Error replying to thread:", error);
                socket.emit("error", { message: "Failed to add reply", type: "REPLY_FAILED", details: error.message });
            }
        });

        // **7. Delete a Thread**
        socket.on("deleteThread", async ({ threadId }) => {
            try {
                // First, check if thread exists
                const thread = await Thread.findById(threadId);
                if (!thread) {
                    return socket.emit("error", { message: "Thread not found", type: "THREAD_NOT_FOUND" });
                }

                // Get all message IDs associated with the thread
                const messagesToDelete = thread.messages;

                // Delete all messages first
                if (messagesToDelete && messagesToDelete.length > 0) {
                    await Message.deleteMany({ _id: { $in: messagesToDelete } });
                }

                // Then delete the thread
                await Thread.findByIdAndDelete(threadId);

                // Notify all clients
                io.emit("threadDeleted", threadId);
            } catch (error) {
                console.error("Error deleting thread:", error);
                socket.emit("error", { message: "Failed to delete thread", type: "DELETE_FAILED", details: error.message });
            }
        });

        // **8. Update Thread**
        socket.on("updateThread", async ({ threadId, newTitle }) => {
            try {
                if (!newTitle || newTitle.trim() === '') {
                    return socket.emit("error", { message: "Title cannot be empty", type: "INVALID_TITLE" });
                }

                const updatedThread = await Thread.findByIdAndUpdate(
                    threadId,
                    { title: newTitle },
                    { new: true }
                );

                if (!updatedThread) {
                    return socket.emit("error", { message: "Thread not found", type: "THREAD_NOT_FOUND" });
                }

                io.emit("threadUpdated", updatedThread);
            } catch (error) {
                console.error("Error updating thread:", error);
                socket.emit("error", { message: "Failed to update thread", type: "UPDATE_FAILED", details: error.message });
            }
        });

        // **9. Get All Threads**
        socket.on("getThreads", async () => {
            try {
                const threads = await Thread.find()
                    .populate("creator")
                    .populate("participants")
                    .populate({
                        path: "messages",
                        populate: {
                            path: "sender",
                            model: "UserDetails"
                        }
                    });

                socket.emit("allThreads", threads);
            } catch (error) {
                console.error("Error fetching threads:", error);
                socket.emit("error", { message: "Failed to fetch threads", type: "FETCH_FAILED", details: error.message });
            }
        });
    });
};

module.exports = { setupSocketEvents };
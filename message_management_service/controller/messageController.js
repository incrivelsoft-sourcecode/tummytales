const { Message, Thread, DirectMessage } = require("../model/messageModel.js");
const UserDetails = require("../model/User.js")
const uploadMedia = require("../utils/uploadMedia.js");
const { io, getReceiverSocketId } = require("../socket/socket.js");

function getFileFormat(mimetype) {
    const formatMap = {
        "application/vnd.google-apps.spreadsheet": "gsheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/vnd.ms-excel": "csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "csv",
    };

    const format = mimetype.split("/")[1];

    return formatMap[mimetype] || (['jpeg', 'png', 'svg', 'svg+xml', 'mp3', 'mpeg', 'mp4', 'csv', 'pdf', 'docx'].includes(format) ? format : null);
}


const setupSocketEvents = () => {
    io.on("connection", (socket) => {
        // **1. Send Message (Text or Media)**
        socket.on("sendMessage", async ({ sender, receiver, content, file, mimetype, filename, replyTo }) => {
            try {
                console.log(mimetype);
                // Validate input parameters
                if (!sender || !receiver) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Sender and receiver IDs are required"
                    });
                }

                console.log("messages: ", sender, receiver, content);

                // Check if users exist
                const isUsersExist = await UserDetails.find({ _id: { $in: [sender, receiver] } });

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
                // Handle file upload if a file is provided
                if (file && mimetype && filename) {
                    try {
                        // Convert the base64 file to a buffer
                        const fileBuffer = Buffer.from(file, "base64");

                        // Upload the file to Cloudinary
                        const mediaURL = await uploadMedia(fileBuffer, mimetype, filename);
                        console.log("mediaURL-------------------------------------", mediaURL);

                        // If the file was uploaded successfully, add it to the media array
                        if (mediaURL) {
                            media = [{
                                url: mediaURL,
                                type: mimetype.split("/")[0], // e.g., "image", "video", "application"
                                format: getFileFormat(mimetype) // e.g., "png", "pdf", "mpeg"
                            }];
                        }
                    } catch (uploadError) {
                        console.log("Error in the sendMessage: ", uploadError);
                        return socket.emit("error", {
                            type: "MEDIA_UPLOAD_ERROR",
                            message: "Failed to upload media",
                            details: uploadError.message
                        });
                    }
                }
                if(replyTo){
                    const isMessageExisting = await Message.findById(replyTo);
                    if(!isMessageExisting){
                        return socket.emit("error", {
                            type: "MESSAGE_NOT_FOUND",
                            message: "Failed to reply for specific message.",
                            details: chatError.message
                        });
                    }
                }
                else{
                    replyTo = null;
                }

                // Create message
                const message = new Message({
                    sender,
                    receiver,
                    content,
                    media,
                    replyTo
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
                console.log("getMessages: ", chatId, userId);
        
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
                const chat = await DirectMessage.findById(chatId).populate('messages');
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
        
                // Prepare query for pagination using message IDs stored in chat
                let query = { _id: { $in: chat.messages } };
        
                if (next) {
                    query = { $and: [{ _id: { $lt: next } }, { _id: { $in: chat.messages } }] };
                }
        
                // Fetch messages with pagination
                const messages = await Message.find(query)
                    .populate('sender', 'user_name email')
                    .populate('receiver', 'user_name email')
                    .sort({ _id: -1 }) // Use `_id` for pagination sorting
                    .limit(limit + 1)  // Fetch one extra to check for nextCursor
                    .lean(); // Improve performance
        
                // Determine if there are more messages
                const hasMore = messages.length > limit;
                const processedMessages = hasMore ? messages.slice(0, limit) : messages;
        
                // Prepare next cursor (ID of the last message in this batch)
                const nextCursor = hasMore ? messages[limit]._id : null;
        
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
        
        

        socket.on("getChats", async ({ userId, page = 1, limit = 10 }) => {
            try {
                if (!userId) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "User ID is required",
                        details: "No user ID provided to fetch chats"
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
        
                // Validate page
                if (page < 1) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Invalid page number",
                        details: "Page number must be greater than 0"
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
        
                // Fetch chats where the user is a participant
                const chats = await DirectMessage.find({ participants: userId })
                    .populate({
                        path: "participants",
                        select: "_id user_name email" // Fetch only necessary fields
                    })
                    .populate({
                        path: "messages",
                        options: { sort: { createdAt: -1 }, limit: 1 }, // Get the latest message
                    })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ createdAt: -1 }); // Sort by the most recent chat
        
                if (!chats.length) {
                    return socket.emit("error", {
                        type: "CONVERSATION_NOT_YET",
                        message: "No conversations found.",
                        details: `No chat records found for user ID: ${userId}`
                    });
                }
        
                // Send response
                socket.emit("chatsPaginated", {
                    chats,
                    page,
                    limit,
                    hasMore: chats.length === limit // Indicates if there are more results
                });
        
            } catch (error) {
                console.error("Error fetching chats:", error);
                socket.emit("error", {
                    type: "SERVER_ERROR",
                    message: "Internal server error",
                    details: error.message
                });
            }
        });
        
    

        socket.on("onSearchUsers", async ({ UserNameOrEmail, page = 1, limit = 10 }) => {
            try {
                if (!UserNameOrEmail) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Search query is required",
                        details: "No username or email provided for search"
                    });
                }
        
                const skip = (page - 1) * limit;
                // console.log("onSearchUsers: ", UserNameOrEmail, page, limit);
        
                // Case-insensitive search using regex
                const query = {
                    $or: [
                        { user_name: { $regex: new RegExp(UserNameOrEmail, "i") } }, 
                        { email: { $regex: new RegExp(UserNameOrEmail, "i") } }
                    ]
                };
        
                // Fetch users with pagination
                const users = await UserDetails.find(query)
                    .select("_id user_name email role")
                    .skip(skip)
                    .limit(limit);
        
                // Count total matching users
                const totalUsers = await UserDetails.countDocuments(query);
        
                socket.emit("usersPaginated", {
                    totalUsers: totalUsers,
                    totalPages: Math.ceil(totalUsers / limit),
                    users: users
                });
        
            } catch (error) {
                console.error("Error while searching the users:", error);
                socket.emit("error", { 
                    type: "SEARCH_FAILED", 
                    message: "Failed to search users", 
                    details: error.message 
                });
            }
        });
        

        // **5. Create Thread**
        socket.on("createThread", async ({ creator, title, content, participants, file, mimetype }) => {
            try {
                console.log("createThread", mimetype);

                // Validate that the thread has either a title or a file
                if (!title && !file) {
                    return socket.emit("error", {
                        type: "EMPTY_MESSAGE",
                        message: "Message must contain either text title or a file"
                    });
                }

                // Initialize the object to save in the database
                const fieldToSave = { creator, title, content, participants };

                // Handle file upload if a file is provided
                if (file && mimetype) {
                    try {
                        // Convert the base64 file to a buffer
                        const fileBuffer = Buffer.from(file, "base64");

                        // Upload the file to Cloudinary
                        const mediaURL = await uploadMedia(fileBuffer, mimetype);
                       
                        // If the file was uploaded successfully, add it to the media array
                        if (mediaURL) {
                            fieldToSave.media = [{
                                url: mediaURL,
                                type: mimetype.split("/")[0], // e.g., "image", "video", "application"
                                format: mimetype.split("/")[1] // e.g., "png", "pdf", "mpeg"
                            }];
                        }
                    } catch (uploadError) {
                        console.log("Error in the createThread: ", uploadError);
                        return socket.emit("error", {
                            type: "MEDIA_UPLOAD_ERROR",
                            message: "Failed to upload media",
                            details: uploadError.message
                        });
                    }
                }

                // Save the thread to the database
                const thread = new Thread(fieldToSave);
                await thread.save();

                // Populate the thread with creator and participants details
                const newThread = await Thread.findById(thread._id)
                    .populate("creator")
                    .populate("participants")
                    .populate({
                        path: "messages",
                        populate: {
                            path: "sender",
                            model: "UserDetails"
                        }
                    });

                // Emit the "threadCreated" event to all clients
                io.emit("threadCreated", newThread);
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
        socket.on("replyToThread", async ({ threadId, sender, content, file, mimetype }) => {
            try {
                // Check if thread exists first
                const thread = await Thread.findById(threadId);
                console.log("replyToThread: ", threadId, sender, content)
                if (!thread) {
                    return socket.emit("error", { message: "Thread not found", type: "THREAD_NOT_FOUND" });
                }

                let media = [];
                if (file && mimetype) {
                    try {
                        const fileBuffer = Buffer.from(file, "base64");

                        const mediaURL = await uploadMedia(fileBuffer, mimetype);

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
                const populatedMessage = await Message.findById(message._id).populate("sender", "role user_name");
                await Thread.findByIdAndUpdate(
                    threadId,
                    { $push: { messages: message._id } }
                );
                io.emit("threadReplyAdded", { threadId, message: populatedMessage });
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

        socket.on("searchThreads", async ({
            searchTerm = "",
            page = 1,
            limit = 10,
            includeMessages = true,
            includeUsers = true
        }) => {
            try {
                // Validate input
                if (page < 1 || limit < 1 || limit > 50) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Invalid pagination parameters",
                        details: "Page must be >= 1 and limit must be between 1 and 50"
                    });
                }

                const skip = (page - 1) * limit;
                const searchRegex = new RegExp(searchTerm, 'i');

                // Build query based on search term
                const query = searchTerm ? {
                    $or: [
                        { title: searchRegex } // Search in thread titles
                    ]
                } : {};

                // If we need to search in messages or users, we need to perform more complex queries
                let threadIds = [];

                // Search in messages if requested
                if (searchTerm && includeMessages) {
                    const matchingMessages = await Message.find({
                        content: searchRegex,
                        parentThread: { $ne: null } // Only include messages associated with threads
                    });

                    const messageThreadIds = matchingMessages.map(msg => msg.parentThread);
                    threadIds = [...threadIds, ...messageThreadIds];
                }

                // Search in users if requested
                if (searchTerm && includeUsers) {
                    const matchingUsers = await UserDetails.find({
                        $or: [
                            { user_name: searchRegex },
                            { email: searchRegex }
                        ]
                    });

                    const userIds = matchingUsers.map(user => user._id);

                    // Find threads where these users are creators or participants
                    const threadsWithMatchingUsers = await Thread.find({
                        $or: [
                            { creator: { $in: userIds } },
                            { participants: { $in: userIds } }
                        ]
                    });

                    const userThreadIds = threadsWithMatchingUsers.map(thread => thread._id);
                    threadIds = [...threadIds, ...userThreadIds];
                }

                // Add thread IDs to query if we found matches in messages or users
                if (threadIds.length > 0) {
                    // Add unique thread IDs to our query
                    const uniqueThreadIds = [...new Set(threadIds.map(id => id.toString()))];
                    query.$or = query.$or || [];
                    query.$or.push({ _id: { $in: uniqueThreadIds } });
                }

                // Count total matching threads for pagination info
                const totalThreads = await Thread.countDocuments(query);

                // Fetch threads with pagination
                const threads = await Thread.find(query)
                    .populate("creator")
                    .populate("participants")
                    .populate({
                        path: "messages",
                        populate: {
                            path: "sender",
                            model: "UserDetails"
                        }
                    })
                    .sort({ createdAt: -1 }) // Most recent first
                    .skip(skip)
                    .limit(limit);

                // Add highlight information for matched terms
                const threadsWithHighlighting = threads.map(thread => {
                    const threadObj = thread.toObject();

                    // If search term is present and found in the title, add highlighting info
                    if (searchTerm && thread.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                        threadObj.searchMatch = {
                            field: 'title',
                            value: thread.title,
                            term: searchTerm
                        };
                    }

                    // Check if this thread was found due to message content match
                    if (includeMessages && searchTerm) {
                        const matchingMessage = thread.messages.find(msg =>
                            msg.content && msg.content.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        if (matchingMessage && (!threadObj.searchMatch || threadObj.searchMatch.field !== 'title')) {
                            threadObj.searchMatch = {
                                field: 'message',
                                value: matchingMessage.content,
                                messageId: matchingMessage._id,
                                term: searchTerm
                            };
                        }
                    }

                    return threadObj;
                });

                // Emit search results
                socket.emit("searchResults", {
                    threads: threadsWithHighlighting,
                    pagination: {
                        page,
                        limit,
                        totalThreads,
                        totalPages: Math.ceil(totalThreads / limit),
                        hasMore: skip + threads.length < totalThreads
                    },
                    searchTerm
                });

            } catch (error) {
                console.error("Error searching threads:", error);
                socket.emit("error", {
                    type: "SEARCH_ERROR",
                    message: "An error occurred while searching threads",
                    details: error.message
                });
            }
        });

        // Get paginated threads (enhance the existing getThreads event)
        socket.on("getThreads", async ({ page = 1, limit = 10 } = {}) => {
            try {
                // Validate pagination parameters
                if (page < 1 || limit < 1 || limit > 50) {
                    return socket.emit("error", {
                        type: "VALIDATION_ERROR",
                        message: "Invalid pagination parameters",
                        details: "Page must be >= 1 and limit must be between 1 and 50"
                    });
                }

                const skip = (page - 1) * limit;

                // Count total threads for pagination info
                const totalThreads = await Thread.countDocuments();

                // Fetch threads with pagination
                const threads = await Thread.find()
                    .populate("creator")
                    .populate("participants")
                    .populate({
                        path: "messages",
                        populate: {
                            path: "sender",
                            model: "UserDetails"
                        }
                    })
                    .sort({ createdAt: -1 }) // Most recent first
                    .skip(skip)
                    .limit(limit);

                // For backwards compatibility, still emit allThreads for older clients
                socket.emit("allThreads", threads);

                // Also emit the new paginatedThreads event
                socket.emit("paginatedThreads", {
                    threads,
                    pagination: {
                        page,
                        limit,
                        totalThreads,
                        totalPages: Math.ceil(totalThreads / limit),
                        hasMore: skip + threads.length < totalThreads
                    }
                });

            } catch (error) {
                console.error("Error fetching threads:", error);
                socket.emit("error", {
                    message: "Failed to fetch threads",
                    type: "FETCH_FAILED",
                    details: error.message
                });
            }
        });
    });
};

module.exports = { setupSocketEvents };
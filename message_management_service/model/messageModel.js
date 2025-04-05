const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'UserDetails', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'UserDetails', required: false }, 
  content: { type: String, required: false }, 
  media: {
    type: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'audio', 'video', 'document', 'application', 'text'], required: true },
      format: { type: String, enum: ['jpeg', 'png', 'svg', 'svg+xml', 'mp3', 'mpeg', 'mp4', 'csv', 'pdf', 'docx', 'gsheet'], required: true },
    }],
    default: [],
  },
  replyTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'Message', // Reference to the parent message
    default: null // Null for non-reply messages
  },
  parentThread: { type: Schema.Types.ObjectId, ref: 'Thread', default: null }, 
}, { timestamps: true });

const ThreadSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'UserDetails', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: {
    type: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'audio', 'video', 'document', 'application'], required: true },
      format: { type: String, enum: ['jpeg', 'png', 'svg', 'mp3', 'mp4', 'csv', 'pdf', 'docx', 'gsheet'], required: true },
    }],
    default: [],
  },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], 
  participants: [{ type: Schema.Types.ObjectId, ref: 'UserDetails' }],
}, { timestamps: true });

const DirectMessageSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'UserDetails', required: true }], 
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], 
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);
const Thread = mongoose.model('Thread', ThreadSchema);
const DirectMessage = mongoose.model('DirectMessage', DirectMessageSchema);

module.exports = { Message, Thread, DirectMessage };
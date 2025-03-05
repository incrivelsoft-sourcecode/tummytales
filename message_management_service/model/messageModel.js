const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'UserDetails', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'UserDetails', required: false }, 
  content: { type: String, required: false }, 
  media: {
    type: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'audio', 'video', 'document'], required: true },
      format: { type: String, enum: ['jpeg', 'png', 'svg', 'mp3', 'mp4', 'csv', 'pdf', 'docx', 'gsheet'], required: true },
    }],
    default: [],
  },
  timestamp: { type: Date, default: Date.now },
  parentThread: { type: Schema.Types.ObjectId, ref: 'Thread', default: null }, 
});

const ThreadSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], 
  participants: [{ type: Schema.Types.ObjectId, ref: 'UserDetails' }], 
  createdAt: { type: Date, default: Date.now },
});

const DirectMessageSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }], 
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], 
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);
const Thread = mongoose.model('Thread', ThreadSchema);
const DirectMessage = mongoose.model('DirectMessage', DirectMessageSchema);

module.exports = { Message, Thread, DirectMessage };
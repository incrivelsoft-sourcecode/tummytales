const mongoose = require('mongoose');

const bookNowSchema = new mongoose.Schema({
     userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UserDetails", 
          required: true,
        },
  name: { type: String, required: true, unique: true }, // 'sleep_essentials', etc.
  items: [
    {
      title: { type: String, required: true },
      links: [{ type: String }]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('BookNow', bookNowSchema);

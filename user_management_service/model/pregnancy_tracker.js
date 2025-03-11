const mongoose = require('mongoose');

const pregnancyTrackerSchema = new mongoose.Schema({  
    user_name: { 
    type: String,
    ref: "UserDetails",
    required: true }, 
    name:{
      type:String,
      required:true,
    },
    weeks: [
      {
        weekNumber: { type: Number, required: true }, // Week 1, Week 2, etc.
        medicationReminders: [
          {
            name: { type: String, required: true }, // "Folic Acid"
            time: { type: String, required: true }, // "08:00"
          },
        ],
        checklists: [
          {
            task: { type: String, required: true }, // "Schedule a prenatal check-up"
            completed: { type: Boolean, default: false },
          },
        ],
      },
    ],
  },{ timestamps: true });

  const PregnancyTracker = mongoose.model('PregnancyTracker',pregnancyTrackerSchema)
  
  module.exports = PregnancyTracker
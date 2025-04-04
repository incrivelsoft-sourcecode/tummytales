const mongoose = require("mongoose");
const UserDetails= require('./User')
const surveySchema = new mongoose.Schema(
  {
    user_name: { 
      type: String,
      ref: "UserDetails",
      required: true }, 
    generalDetails: {
      full_name: String,
      age: Number,
      gender: String,
      nationality: String,
      generation: String,
    },
    pregnancyStatus: {
      currentlyPregnant: { type: Boolean, default: false },
      pregnancyWeeks: Number,
      estimatedDueDate: Date,
      firstPregnancy: { type: Boolean, default: false },
    },
    healthCare: {
      hasProvider: { type: Boolean, default: false },
      prenatalServices: String,
      healthcareSystem: String,
      navigationExperience: String,
      culturalChallenges: { type: Boolean, default: false },
    },
    lifestylePreferences: {
      preferredLanguage: String,
      dietaryPreferences: String,
      physicalActivity: { type: Boolean, default: false },
      primaryInfoSource: String,
    },
    experienceAndExpectations: {
      expectations: String,
      challenges: String,
      wantsPersonalizedResources: { type: Boolean, default: false },
      additionalComments: String,
    },
  },
  { timestamps: true }
);

const supporterSchema =new mongoose.Schema(
  {
   user_name: { 
    type: String,
    ref: "UserDetails",
    required: true }, 
    name:{
      type:String,
      required:true,
    },
    relationship:{
      type:String,
      required:true,
    },
    hasAccess:{
      type:Boolean,
      default:false,
    },
    accessPermissions:{
      pregnancyTracker:{
        type:Boolean,
        defalut:false,
      },
      dailyJournal:{
        type:Boolean,
        defalut:false,
      },
      appointment:{
        type:Boolean,
        default:false,
      },
      babyNames:{
        type:Boolean,
        default:false,
      },
    },
    referralPin:{
        type:String,
        unique:true,
      },
},{timestamps:true}
);


// 🔹 Pre-save hook to generate a unique referralPin
supporterSchema.pre("save", function (next) {
  if (!this.referralPin) {
    this.referralPin = `SUPP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});


const Survey = mongoose.model("Survey", surveySchema);

const SupporterSurvey =mongoose.model("SupporterSurvey",supporterSchema)
module.exports = {Survey,SupporterSurvey};

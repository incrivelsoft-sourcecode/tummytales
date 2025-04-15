const mongoose = require("mongoose");
const UserDetails= require('./User')
const surveySchema = new mongoose.Schema(
  {
    user_name: { 
      type: String,
      ref: "UserDetails",
      required: true }, 
   generalDetails: {
      first_name: String,
      last_name:String,
     // age: Number,
      dob:Date,
      gender: String,
      nationality: String,
      Phonenumber:String,
      email:String,
      country:String,
      Addressline1:String,
      Addressline2:String,
      city:String,
      State:String,
      Zip_code:String,
    },
    pregnancyStatus: {
      currentlyPregnant: { type: Boolean, default: false },
      //pregnancyWeeks: Number,
      Last_menstrualperiod: Date,
      estimatedDueDate: Date,
      PregnancyLoss: { type: Boolean, default: false },
      firstChild: { type: Boolean, default: false },
    },
 healthCare: {
  hasPrimaryCarePhysician: { type: String, enum: ['Yes', 'No', 'Not Sure'], default: '' },
  hasOBGYN: { type: String, enum: ['Yes', 'No', 'Not Sure'], default: '' },
  insuranceProvider: { type: String, default: '' },
  medications: [
    {
      name: { type: String, required: true },
      dosage: { type: String },
      frequency: { type: String }
    }
  ],
  consumesAlcoholOrSmokes: { type: String, enum: ['Yes', 'No', 'Occasionally'], default: '' }
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






   /* healthCare: {
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
    },*/
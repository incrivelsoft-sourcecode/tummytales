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
  Last_menstrualperiod: Date,
  estimatedDueDate: Date,

  PregnancyLossInfo: {
    hasPregnancyLoss: { type: Boolean, default: false },
    details: {
      dateOfLoss: Date,
      reason: String,
      gestationWeeks: Number,
      treatmentLocation: String, // City, State, Country
    }
  },

  firstChildInfo: {
    isFirstChild: { type: Boolean, default: false },
    details: {
      dob: Date,
      complications: String,
      deliverymethod: String,
      childbornlocation: String,
      gestationalAgeAtBirth: String // or nested { weeks, days }
    }
  }
 },

healthCare: {
  primaryCare: {
    hasPrimaryCarePhysician: { type: Boolean, default: false },
    details: {
      first_name: String,
      last_name: String,
      country: String,
      Addressline1: String,
      Addressline2: String,
      city: String,
      State: String,
      Zip_code: String,
      Phonenumber: String
    }
  },
  obgyn: {
    hasOBGYN: { type: Boolean, default: false },
    details: {
      first_name: String,
      last_name: String,
      country: String,
      Addressline1: String,
      Addressline2: String,
      city: String,
      State: String,
      Zip_code: String,
      Phonenumber: String
    }
  },

  insuranceProvider: String,

  medications: [
    {
      name: { type: String, required: true },
      dosage: String,
      frequency: String
    }
  ],

  consumesAlcoholOrSmokes: { type: Boolean, default: false }
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
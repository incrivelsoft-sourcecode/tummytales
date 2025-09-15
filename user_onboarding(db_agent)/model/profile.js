// const mongoose = require("mongoose");
// const UserDetails= require('../model/User')
// const surveySchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "UserDetails", 
//       required: true,
//     },

//     generalDetails: {
//       first_name: String,
//       last_name: String,
//       dob: Date,
//       gender: String,
//       nationality: String,
//       Phonenumber: String,
//       email: String,
//       country: String,
//       Addressline1: String,
//       Addressline2: String,
//       city: String,
//       State: String,
//       Zip_code: String,
//     },
//     pregnancyStatus: {
//       //currentlyPregnant: { type: Boolean, default: false },
//       currentlyPregnant:String,
//       Last_menstrualperiod: Date,
//       estimatedDueDate: Date,
//       weeksPregnant: Number,
//       PregnancyLossInfo: {
//         hasPregnancyLoss: { type: Boolean, default: false },
//         details: {
//           dateOfLoss: Date,
//           reason: String,
//           gestationWeeks: Number,
//           treatmentLocation: String, // City, State, Country
//         },
//       },

//       firstChildInfo: {
//         isFirstChild: { type: Boolean, default: false },
//         details: {
//           dob: Date,
//           complications: String,
//           deliverymethod: String,
//           childbornlocation: String,
//           gestationalAgeAtBirth: String, // or nested { weeks, days }
//         },
//       },
//     },

//     healthCare: {
//       primaryCare: {
//         hasPrimaryCarePhysician: { type: Boolean, default: false },
//         details: {
//           first_name: String,
//           last_name: String,
//           medical_office_name: String,
//           country: String,
//           Addressline1: String,
//           Addressline2: String,
//           city: String,
//           State: String,
//           Zip_code: String,
//           Phonenumber: String,
//         },
//       },
//       obgyn: {
//         hasOBGYN: { type: Boolean, default: false },
//         details: {
//           first_name: String,
//           last_name: String,
//           medical_office_name: String,
//           country: String,
//           Addressline1: String,
//           Addressline2: String,
//           city: String,
//           State: String,
//           Zip_code: String,
//           Phonenumber: String,
//         },
//       },

//       insuranceProvider: String,
      
//   medication1: {
//     name: String,
//     dosage: String,
//     frequency: String,
//   },
//   medication2: {
//     name: String,
//     dosage: String,
//     frequency: String,
//   },
//      consumesAlcoholOrSmokes:String,
//      // consumesAlcoholOrSmokes: { type: Boolean, default: false },
//     },
//     lifestylePreferences: {
//       preferredLanguage: String,
//       dietaryPreferences: String,
//       physicalActivity: String,
//       primaryInfoSource: String,//supporter description
//       // physical activity fileds
//       heightCm: Number, // Height (cm)
//       weightKg: Number, // Weight (kg)
//       prePregnancyFitnessLevel:String,
//       preExistingConditions: [String],
//       preferredExercises: [String],      
//     },
//     experienceAndExpectations: {
//       expectations: String,
//       challenges: String,
//      // wantsPersonalizedResources: { type: Boolean, default: false },
//      wantsPersonalizedResources:String,
//       additionalComments: String,
//     },
//   },
//   { timestamps: true }
// );

// const SupporterProfile_Schema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "UserDetails", 
//       required: true,
//     },
//       first_name: String,
//       last_name: String,
//       dob: Date,
//       gender: String,
//       nationality: String,
//       Phonenumber: String,
//       email: String,
//       country: String,
//       Addressline1: String,
//       Addressline2: String,
//       city: String,
//       State: String,
//       Zip_code: String,
//   },
//   { timestamps: true }
// );


// // const Survey = mongoose.model("Survey", surveySchema);
// const MomProfile = mongoose.model("MomProfile", surveySchema);


// const SupporterProfile = mongoose.model("SupporterProfile",SupporterProfile_Schema);


// module.exports = {MomProfile,SupporterProfile};





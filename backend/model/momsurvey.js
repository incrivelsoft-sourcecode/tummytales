const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema(
  {
    generalDetails: {
      age: Number,
      gender: String,
      identity: String,
      nationality: String,
      generation: String,
    },
    pregnancyStatus: {
      currentlyPregnant: Boolean,
      pregnancyWeeks: Number,
      estimatedDueDate: Date,
      firstPregnancy: Boolean,
    },
    healthCare: {
      hasProvider: Boolean,
      prenatalServices: String,
      healthcareSystem: String,
      navigationExperience: String,
      culturalChallenges: Boolean,
    },
    lifestylePreferences: {
      preferredLanguage: String,
      dietaryPreferences: String,
      physicalActivity: Boolean,
      primaryInfoSource: String,
    },
    experienceAndExpectations: {
      expectations: String,
      challenges: String,
      wantsPersonalizedResources: Boolean,
      additionalComments: String,
    },
  },
  { timestamps: true }
);

const Survey = mongoose.model("Survey", surveySchema);
module.exports = Survey;

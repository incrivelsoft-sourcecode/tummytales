const mongoose = require("mongoose");

const aiMealSchema = new mongoose.Schema({
  user_name: {
    type: String,
    ref: "UserDetails",
    required: true
  },
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey", 
   // required: true
  },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "snack", "dinner"],
    required: true
  },
  preferences: {
    cuisine: [{ type: String }],
    dietary: [{ type: String }],
    allergies: [{ type: String }]
  },
 reminderTime: {
  type: Date,
  required: true
},
repeatDaily: {
  type: Boolean,
  default: false
},
userLocalTime: Date,

  aiGeneratedMeal: {
  title: String,
  servings: Number,
  ingredients: [String],
  instructions: String,
  image: String,
  nutritionalValues: {
    Calories: String,
    Protein: String,
    Carbohydrates: String,
    Fat: String,
    Fiber: String,
    Calcium: String,
    Iron: String,
  }
}
,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AIMeal = mongoose.model("AIMeal", aiMealSchema);
module.exports = AIMeal;

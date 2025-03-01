const express = require ('express');
const Survey = require('../model/momsurvey');

const createsurvey = async (req, res) => {
  try {
      const {
          age,
          gender,
          identity,
          nationality,
          generation,
          currentlyPregnant,
          pregnancyWeeks,
          estimatedDueDate,
          firstPregnancy,
          hasProvider,
          prenatalServices,
          healthcareSystem,
          navigationExperience,
          culturalChallenges,
          preferredLanguage,
          dietaryPreferences,
          physicalActivity,
          primaryInfoSource,
          expectations,
          challenges,
          wantsPersonalizedResources,
          additionalComments,
      } = req.body;

      // 🔍 Define all required fields
      const requiredFields = {
          age, gender, identity, nationality, generation,
          currentlyPregnant, pregnancyWeeks, estimatedDueDate, firstPregnancy,
          hasProvider, prenatalServices, healthcareSystem, navigationExperience, culturalChallenges,
          preferredLanguage, dietaryPreferences, physicalActivity, primaryInfoSource,
          expectations, challenges, wantsPersonalizedResources, additionalComments
      };

      // 🚨 Check for missing fields
      const missingFields = Object.entries(requiredFields)
          .filter(([key, value]) => value === undefined || value === null || value === "")
          .map(([key]) => key);

      if (missingFields.length > 0) {
          return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
      }

      // ✅ Creating a new survey response object
      const newSurvey = new Survey({
          generalDetails: { age, gender, identity, nationality, generation },
          pregnancyStatus: { currentlyPregnant, pregnancyWeeks, estimatedDueDate, firstPregnancy },
          healthCare: { hasProvider, prenatalServices, healthcareSystem, navigationExperience, culturalChallenges },
          lifestylePreferences: { preferredLanguage, dietaryPreferences, physicalActivity, primaryInfoSource },
          experienceAndExpectations: { expectations, challenges, wantsPersonalizedResources, additionalComments }
      });

      await newSurvey.save();
      res.status(200).json({ message: "Survey submitted successfully!", survey: newSurvey });

  } catch (error) {
      console.error("Survey submission failed:", error);
      res.status(500).json({ error: "Failed to save survey data" });
  }
};

const getAllSurveys = async (req,res)=>{
    try{
        const surveys = await Survey.find();

        return res.status(200).json({ success:true,surveys})

    }catch(error){
        console.error('Failed to get allsurveys',error);
        return res.status(505).json({error:"Failed to retrive surveys"})
    }
}
// const update_momsurvey = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updates = req.body;

//         // 🚨 Check if the survey exists
//         const existingSurvey = await Survey.findById(id);
//         if (!existingSurvey) {
//             return res.status(404).json({ error: "Survey not found" });
//         }

//         // ✅ Convert updates to use correct MongoDB dot-notation
//         const updateQuery = {};
//         for (const key in updates) {
//             if (updates[key] !== undefined) {
//                 // 🛠 If the field is in `pregnancyStatus`, prepend the key with `pregnancyStatus.`
//                 if (["currentlyPregnant", "pregnancyWeeks", "estimatedDueDate", "firstPregnancy"].includes(key)) {
//                     updateQuery[`pregnancyStatus.${key}`] = updates[key];
//                 } 
//                 // 🛠 If the field is in `generalDetails`, prepend `generalDetails.`
//                 else if (["age", "gender", "identity", "nationality", "generation"].includes(key)) {
//                     updateQuery[`generalDetails.${key}`] = updates[key];
//                 } 
//                 // 🛠 If the field is in `healthCare`, prepend `healthCare.`
//                 else if (["hasProvider", "prenatalServices", "healthcareSystem", "navigationExperience", "culturalChallenges"].includes(key)) {
//                     updateQuery[`healthCare.${key}`] = updates[key];
//                 } 
//                 // 🛠 If the field is in `lifestylePreferences`, prepend `lifestylePreferences.`
//                 else if (["preferredLanguage", "dietaryPreferences", "physicalActivity", "primaryInfoSource"].includes(key)) {
//                     updateQuery[`lifestylePreferences.${key}`] = updates[key];
//                 } 
//                 // 🛠 If the field is in `experienceAndExpectations`, prepend `experienceAndExpectations.`
//                 else if (["expectations", "challenges", "wantsPersonalizedResources", "additionalComments"].includes(key)) {
//                     updateQuery[`experienceAndExpectations.${key}`] = updates[key];
//                 } 
//                 // 🛠 Otherwise, just add it as is
//                 else {
//                     updateQuery[key] = updates[key];
//                 }
//             }
//         }

//         // 🛠 Debugging - Check final update query
//         console.log("Final updateQuery:", updateQuery);

//         // ✅ Apply the update correctly using $set
//         const updatedSurvey = await Survey.findByIdAndUpdate(
//             id,
//             { $set: updateQuery },  // Ensure only specific fields get updated
//             { new: true, runValidators: true }
//         );

//         return res.status(200).json({ message: 'Survey updated successfully', survey: updatedSurvey });

//     } catch (error) {
//         console.error('Failed to update survey:', error);
//         return res.status(500).json({ error: "Failed to update survey" });
//     }
// };

const update_momsurvey = async (req,res)=>{
    try{ 
        const{id}= req.params;
       const updates = req.body;
 
       const existingsurvey = await Survey.findById(id);
       if(!existingsurvey){
        return res.status(404).json({error: "Survey not found"});
       }

       const updatequery={};
       for(const key in updates){
        if(updates[key]!==undefined ){
            updatequery[key]=updates[key];
        }
       }


       const Updatedsurvey = await Survey.findByIdAndUpdate(
        id,
        {$set:updatequery},
        {new:true,runValidators:true}
    );
        return res.status(200).json({message :'survey updated successfully',survey:Updatedsurvey})

    }catch(error){
       console.error('failed to update files',error);
       return res.status(500).json({error:"Failed to update survey"})

    }
}

const delete_momsurvey= async(req,res)=>{
    try{
        const {id}= req.params;
        const remove =req.body;

        const existingSurvey =await Survey.findById(id);
        if(!existingSurvey){
            return res.status(404).json({error:'suvery not found'});
        }

        const deletequery={}
        for(const key in remove){
            if(remove!=undefined){
                deletequery[key]=""
            }
        }
 const deletedsurvey = await Survey.findByIdAndUpdate(
    id,
    {$unset:deletequery},
    {new:true,runValidators:true}
);
  return res.status(200).json({message:'survey deleted successfully',survey:deletedsurvey})
   
    }catch(error){
        console.error('error:failed to delete',error);
        return res.status(404).json({error:'failed to delete files'});
    }
}



module.exports = {createsurvey ,update_momsurvey,getAllSurveys,delete_momsurvey} 
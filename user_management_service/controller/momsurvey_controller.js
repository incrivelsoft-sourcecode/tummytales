const express = require ('express');
const Survey = require('../model/momsurvey');

const createsurvey = async (req, res) => {
  try {
      const {
        full_name,
          age,
          gender,
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
         full_name,age, gender,nationality, generation,
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
          generalDetails: { full_name,age, gender,nationality, generation },
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

const getbyid_momsurvey = async(req,res)=>{
    try{
        const {id}=req.params;
        const survey = await Survey.findById(id);
        if(!survey){
            return res.status(404).json({error:'survey not found'});
        }
        return res.status(200).json({message:'Survey retrived successfully',survey})

    }catch(error){
        console.error('failed to fetch detials',error);
        return res.status(500).json({error:'failed to fetch details'})
    }
}

const getAllSurveys = async (req,res)=>{
    try{
        const surveys = await Survey.find();

        return res.status(200).json({ success:true,surveys})

    }catch(error){
        console.error('Failed to get allsurveys',error);
        return res.status(505).json({error:"Failed to retrive surveys"})
    }
}



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

const delete_momsurvey = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the survey exists
        const existingSurvey = await Survey.findById(id);
        if (!existingSurvey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Delete the survey
        await Survey.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Survey deleted successfully' });
    } catch (error) {
        console.error('Error: Failed to delete', error);
        return res.status(500).json({ error: 'Failed to delete survey' });
    }
};



module.exports = {createsurvey ,update_momsurvey,getAllSurveys,getbyid_momsurvey,delete_momsurvey} 
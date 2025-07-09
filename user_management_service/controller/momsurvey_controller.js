const express = require ('express');
const {MomProfile} = require('../model/profile');
const mongoose= require('mongoose');
const User = require('../model/User')

const createsurvey = async (req, res) => {
    try {
     const userId = req.user.id; 
    // const userId = req.user.effectiveUserId;

      const {
       // user_name,
       // userId,
        // generalDetails
        first_name,
        last_name,
        dob,
        gender,
        nationality,
        Phonenumber,
        email,
        country,
        Addressline1,
        Addressline2,
        city,
        State,
        Zip_code,

        // pregnancyStatus
        currentlyPregnant,
        Last_menstrualperiod,
        estimatedDueDate,
        hasPregnancyLoss,
        dateOfLoss,
        reason,
        gestationWeeks,
        treatmentLocation,

        isFirstChild,
        firstChildDob,
        complications,
        deliverymethod,
        childbornlocation,
        gestationalAgeAtBirth,

        // healthCare
        hasPrimaryCarePhysician,
        primaryFirst_name,
        primaryLast_name,
        primaryMedicalOffice_name,
        primaryCountry,
        primaryAddressline1,
        primaryAddressline2,
        primaryCity,
        primaryState,
        primaryZip_code,
        primaryPhonenumber,

        hasOBGYN,
        obgynFirst_name,
        obgynLast_name,
        obgynMedicalOffice_name,
        obgynCountry,
        obgynAddressline1,
        obgynAddressline2,
        obgynCity,
        obgynState,
        obgynZip_code,
        obgynPhonenumber,

        insuranceProvider,
        //medications,
        medication1Name,
        medication1Dosage,
        medication1Frequency,
      
        medication2Name,
        medication2Dosage,
        medication2Frequency,
         consumesAlcoholOrSmokes,

        preferredLanguage,
        dietaryPreferences,
        physicalActivity,
        primaryInfoSource,
        expectations,
        challenges,
        wantsPersonalizedResources,
        additionalComments,
      } = req.body;
  
      const requiredFields = {
       // user_name,
        first_name,
        last_name,
        dob,
        gender,
        nationality,
        Phonenumber,
        email,
        country,
        Addressline1,
        city,
        State,
        Zip_code,
       // medication2Name
      };
  
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => value === undefined || value === null || value === "")
        .map(([key]) => key);
  
      if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
      }
  
      const newSurvey = new MomProfile({
       // user_name,
        userId,
        generalDetails: {
          first_name,
          last_name,
          dob,
          gender,
          nationality,
          Phonenumber,
          email,
          country,
          Addressline1,
          Addressline2,
          city,
          State,
          Zip_code
        },
        pregnancyStatus: {
          currentlyPregnant,
          Last_menstrualperiod,
          estimatedDueDate,
          PregnancyLossInfo: {
            hasPregnancyLoss,
            details: hasPregnancyLoss ? {
              dateOfLoss,
              reason,
              gestationWeeks,
              treatmentLocation
            } : undefined
          },
          firstChildInfo: {
            isFirstChild,
            details: isFirstChild ? {
              dob: firstChildDob,
              complications,
              deliverymethod,
              childbornlocation,
              gestationalAgeAtBirth
            } : undefined
          }
        },
        healthCare: {
          primaryCare: {
            hasPrimaryCarePhysician,
            details: hasPrimaryCarePhysician ? {
              first_name: primaryFirst_name,
              last_name: primaryLast_name,
              medical_office_name:primaryMedicalOffice_name,
              country: primaryCountry,
              Addressline1: primaryAddressline1,
              Addressline2: primaryAddressline2,
              city: primaryCity,
              State: primaryState,
              Zip_code: primaryZip_code,
              Phonenumber: primaryPhonenumber
            } : undefined
          },
          obgyn: {
            hasOBGYN,
            details: hasOBGYN ? {
              first_name: obgynFirst_name,
              last_name: obgynLast_name,
              medical_office_name:obgynMedicalOffice_name,
              country: obgynCountry,
              Addressline1: obgynAddressline1,
              Addressline2: obgynAddressline2,
              city: obgynCity,
              State: obgynState,
              Zip_code: obgynZip_code,
              Phonenumber: obgynPhonenumber
            } : undefined
          },
          insuranceProvider,
          //medications,
          medication1: {
            name: medication1Name,
            dosage: medication1Dosage,
            frequency: medication1Frequency,
          },
          medication2: {
            name: medication2Name,
            dosage: medication2Dosage,
            frequency: medication2Frequency,
          },
          consumesAlcoholOrSmokes,
        },
        lifestylePreferences: { preferredLanguage, dietaryPreferences, physicalActivity, primaryInfoSource },
          experienceAndExpectations: { expectations, challenges, wantsPersonalizedResources, additionalComments }
      });
  
      await newSurvey.save();
      
// ✅ Activate the user
await User.findByIdAndUpdate(userId, { isActive: true });
      res.status(200).json({ message: "Survey submitted successfully!", survey: newSurvey });
  
    } catch (error) {
      console.error("Survey submission failed:", error);
      res.status(500).json({ error: "Failed to save survey data" });
    }
  };


const getbyid_momsurvey = async(req,res)=>{
    try{
        const {id}=req.params;
       // const { userId } = req.query;
        const userId = req.user.id;
        //const userId = req.user.effectiveUserId || req.user.id;
        if (!userId) {
          return res.status(400).json({ error: "User Id is required" });
      }
        const survey = await MomProfile.findOne({_id: id, userId } );
        if(!survey){
            return res.status(404).json({error:'survey not found'});
        }
        return res.status(200).json({message:'Survey retrived successfully',survey})

    }catch(error){
        console.error('failed to fetch detials',error);
        return res.status(500).json({error:'failed to fetch details'})
    }
}

const getAllSurveys = async (req, res) => {
  try {
   // const { userId } = req.query; // Accessing userId from the query string
    const userId = req.user.id;
    //const userId = req.user.effectiveUserId || req.user.id;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const surveys = await MomProfile.find({ userId });

    if (!surveys || surveys.length === 0) {
      return res.status(404).json({ message: "No surveys found for this user" });
    }

    return res.status(200).json({ success: true, surveys });
  } catch (error) {
    console.error("Failed to get all surveys", error);
    return res.status(500).json({ error: "Failed to retrieve surveys" });
  }
};

const update_momsurvey = async (req, res) => {
  try {
    const { id } = req.params; // ID of the survey
    const { ...updates } = req.body; // userId and other fields to update
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ error: "User Id is required for verification" });
    }

    const existingSurvey = await MomProfile.findOne({ _id: id });

    if (!existingSurvey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    if (existingSurvey.userId.toString() !== userId) {
      return res.status(403).json({ error: "UserId does not match the survey owner" });
    }

    // Prepare update query
    const updateQuery = {};
    for (const key in updates) {
      if (updates[key] !== undefined) {
        updateQuery[key] = updates[key];
      }
    }

    const updatedSurvey = await MomProfile.findOneAndUpdate(
      { _id: id },
      { $set: updateQuery },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Survey updated successfully',
      survey: updatedSurvey,
    });

  } catch (error) {
    console.error('Failed to update survey', error);
    return res.status(500).json({ error: "Failed to update survey" });
  }
};


const delete_momsurvey = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the survey exists
        const existingSurvey = await MomProfile.findById(id);
        if (!existingSurvey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Delete the survey
        await MomProfile.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Survey deleted successfully' });
    } catch (error) {
        console.error('Error: Failed to delete', error);
        return res.status(500).json({ error: 'Failed to delete survey' });
    }
};

const deleteallsurveys = async(req,res)=>{
  try{
    const result =await MomProfile.deleteMany({});
    res.json({message:'all surveys deleted successfully'});
  }catch(err){
    res.status(500).json({message:err.message});
  }
}


module.exports = {createsurvey ,update_momsurvey,getAllSurveys,getbyid_momsurvey,delete_momsurvey,
  deleteallsurveys} 





























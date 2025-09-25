const express = require ('express');
const {MomProfile} = require('../model/profile');
const mongoose= require('mongoose');
const User = require('../model/User')
const axios = require("axios");

const createsurvey = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ still from middleware

    const {
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

      currentlyPregnant,
      Last_menstrualperiod,
      estimatedDueDate,
      weeksPregnant,
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
      heightCm,
      weightKg,
      prePregnancyFitnessLevel,
      preExistingConditions,
      preferredExercises,

      expectations,
      challenges,
      wantsPersonalizedResources,
      additionalComments,
    } = req.body;

    // ✅ Required field validation stays same
    const requiredFields = {
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
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing fields: ${missingFields.join(", ")}`,
      });
    }

    


    // ✅ Build clean payload for Python
    const surveyPayload = {
      userId ,
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
        Zip_code,
      },
      pregnancyStatus: {
        currentlyPregnant,
        Last_menstrualperiod,
        estimatedDueDate,
        weeksPregnant,
        PregnancyLossInfo: {
          hasPregnancyLoss,
          details: hasPregnancyLoss
            ? { dateOfLoss, reason, gestationWeeks, treatmentLocation }
            : undefined,
        },
        firstChildInfo: {
          isFirstChild,
          details: isFirstChild
            ? {
                dob: firstChildDob,
                complications,
                deliverymethod,
                childbornlocation,
                gestationalAgeAtBirth,
              }
            : undefined,
        },
      },
      healthCare: {
        primaryCare: {
          hasPrimaryCarePhysician,
          details: hasPrimaryCarePhysician
            ? {
                first_name: primaryFirst_name,
                last_name: primaryLast_name,
                medical_office_name: primaryMedicalOffice_name,
                country: primaryCountry,
                Addressline1: primaryAddressline1,
                Addressline2: primaryAddressline2,
                city: primaryCity,
                State: primaryState,
                Zip_code: primaryZip_code,
                Phonenumber: primaryPhonenumber,
              }
            : undefined,
        },
        obgyn: {
          hasOBGYN,
          details: hasOBGYN
            ? {
                first_name: obgynFirst_name,
                last_name: obgynLast_name,
                medical_office_name: obgynMedicalOffice_name,
                country: obgynCountry,
                Addressline1: obgynAddressline1,
                Addressline2: obgynAddressline2,
                city: obgynCity,
                State: obgynState,
                Zip_code: obgynZip_code,
                Phonenumber: obgynPhonenumber,
              }
            : undefined,
        },
        insuranceProvider,
        medication1: { name: medication1Name, dosage: medication1Dosage, frequency: medication1Frequency },
        medication2: { name: medication2Name, dosage: medication2Dosage, frequency: medication2Frequency },
        consumesAlcoholOrSmokes,
      },
      lifestylePreferences: {
        preferredLanguage,
        dietaryPreferences,
        physicalActivity,
        primaryInfoSource,
        heightCm,
        weightKg,
        prePregnancyFitnessLevel,
        preExistingConditions,
        preferredExercises,
      },
      experienceAndExpectations: {
        expectations,
        challenges,
        wantsPersonalizedResources,
        additionalComments,
      },
    };

    // ✅ Send to Python API
    const response = await axios.post(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/mom`,
      surveyPayload,
      {
        headers: {
          "Content-Type": "application/json",
           "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    // ✅ (Optional) mark user active in Node DB if still needed
    //await User.findByIdAndUpdate(userId, { isActive: true });
 // 5️⃣ Update Python DB with MFA OTP
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${userId}`,
      { isActive: true },
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.status(200).json({
      message: "Survey submitted successfully via Python API!",
      pythonResponse: response.data,
    });
  } catch (error) {
    console.error("Survey submission failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to save survey data",
      details: error.response?.data,
    });
  }
};

const get_momsurvey = async(req,res)=>{
    try{
       
        const userId = req.user.id;
        //const userId = req.user.effectiveUserId || req.user.id;
        if (!userId) {
          return res.status(400).json({ error: "User Id is required" });
      }
        // const survey = await MomProfile.findOne({userId } );
        // if(!survey){
        //     return res.status(404).json({error:'survey not found'});
        // }
         // Call Python API
    const response = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/mom`,
      {
        params: { user_id: userId },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );
 
    if (!response.data) {
      return res.status(404).json({ error: "Survey not found" });
    }
        return res.status(200).json({message:'Survey retrived successfully',survey: response.data})

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

       const response = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/mom`,
      {
        params: { user_id: userId },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );
 
    return res.status(200).json({ success: true,  survey: response.data, });
  } catch (error) {
    console.error("Failed to get all surveys", error);
    console.error("Failed to get all surveys", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to retrieve surveys",
      details: error.response?.data, });
  }
};

const update_momsurvey = async (req, res) => {
  try {
   // const { id } = req.params; // ID of the survey
    const { ...updates } = req.body; // userId and other fields to update
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ error: "User Id is required for verification" });
    }

    // const existingSurvey = await MomProfile.findOne({ userId });

    // if (!existingSurvey) {
    //   return res.status(404).json({ error: "Survey not found" });
    // }

    // if (existingSurvey.userId.toString() !== userId) {
    //   return res.status(403).json({ error: "UserId does not match the survey owner" });
    // }

     // 1️⃣ Check if survey exists in Python DB
    const existingSurveyResp = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/mom`,
      {
        params: { user_id: userId },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    const existingSurvey = existingSurveyResp.data;

    if (!existingSurvey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    if (existingSurvey.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "UserId does not match the survey owner" });
    }

    // Prepare update query
    const updateQuery = {};
    for (const key in updates) {
      if (updates[key] !== undefined) {
        updateQuery[key] = updates[key];
      }
    }
// 1️⃣ Call Python PATCH API (it returns updated survey directly now)
    const patchResp = await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/mom`,
      updateQuery,
      {
        params: { user_id: userId },
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    const updatedSurvey = patchResp.data.survey;

    return res.status(200).json({
      message: "Survey updated successfully",
      survey: updatedSurvey,
    });

  } catch (error) {
    console.error('Failed to update survey', error);
    console.error("Failed to update survey", error.response?.data || error.message);
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


module.exports = {createsurvey ,update_momsurvey,getAllSurveys,get_momsurvey,
  delete_momsurvey} 





























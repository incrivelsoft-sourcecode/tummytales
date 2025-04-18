const express = require ('express');
const {Survey,SupporterSurvey} = require('../model/momsurvey');
const mongoose= require('mongoose');

const createsurvey = async (req, res) => {
    try {
      const {
        user_name,
        userId,
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
        obgynCountry,
        obgynAddressline1,
        obgynAddressline2,
        obgynCity,
        obgynState,
        obgynZip_code,
        obgynPhonenumber,

        insuranceProvider,
        medications,
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
        Zip_code
      };
  
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => value === undefined || value === null || value === "")
        .map(([key]) => key);
  
      if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
      }
  
      const newSurvey = new Survey({
        user_name,
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
          medications,
          consumesAlcoholOrSmokes,
          lifestylePreferences: { preferredLanguage, dietaryPreferences, physicalActivity, primaryInfoSource },
          experienceAndExpectations: { expectations, challenges, wantsPersonalizedResources, additionalComments }

        }
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
        const {userId}=req.params;
        const survey = await Survey.findOne({ userId } );
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
    const { userId } = req.query; // Accessing userId from the query string

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const surveys = await Survey.find({ userId });

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
    const { userId } = req.params;
    const updates = req.body;
    
    // console.log("Incoming userId param:", userId);

    // Find the existing survey using userId as a string
    const existingsurvey = await Survey.findOne({ userId });
    if (!existingsurvey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    // Build update query from non-undefined fields
    const updateQuery = {};
    for (const key in updates) {
      if (updates[key] !== undefined) {
        updateQuery[key] = updates[key];
      }
    }

    // Update the survey
    const Updatedsurvey = await Survey.findOneAndUpdate(
      { userId },
      { $set: updateQuery },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Survey updated successfully',
      survey: Updatedsurvey,
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

const deleteallsurveys = async(req,res)=>{
  try{
    const result =await Survey.deleteMany({});
    res.json({message:'all surveys deleted successfully'});
  }catch(err){
    res.status(500).json({message:err.message});
  }
}

const generateReferralPin = async (req, res) => {
    try {
        const referralPin = `SUPP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        return res.status(200).json({ referralPin });
    } catch (error) {
        console.error('Failed to generate referral PIN', error);
        return res.status(500).json({ error: 'Failed to generate referral PIN' });
    }
};

const addsupport = async(req,res)=>{

    try{
        const {
            user_name,
            name,
            relationship,
            hasAccess,
            accessPermissions,
            referralPin
        }= req.body;

         // 🔹 Generate a unique referralPin
   // const referralPin = `SUPP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const requiredfields={
           // user_name,
            name,
            relationship,
            hasAccess,
            accessPermissions,
           
        }
        const missingfileds= Object.entries(requiredfields)
            .filter(([key,value]) => value === undefined || value ==="null" || value ==="")
            .map(([key])=> key);
        if(missingfileds.length>0){
            return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
        }

        const newSupport = new SupporterSurvey({
            user_name,
            name,
            relationship,
            hasAccess,
            accessPermissions,
            referralPin
        })
        await newSupport.save();
      return res.status(200).json({message:'Supported added successfully',supporter:newSupport})
    }catch(error){
        console.error('failed to add supporter',error);
        return res.status(500).json({error:'failed to add supporter'})
    }
}


const getallSupporters= async(req,res)=>{
    try{
        const supporters= await SupporterSurvey.find()
        return res.status(200).json({message:'Supporters retrived successfully',supporter:supporters})


    }catch(error){
        console.error('failed to fetch supporters',error)
        return res.status(400).json({error:'failed to fetch supporters'})
    }

}

const getSupporterbyid = async (req,res)=>{
try{

    const {id} = req.params;

    const supporter = await SupporterSurvey.findById(id)
    if(!supporter){
        return res.status(400).json({error:'supporter not found'})
    }

    return res.status(200).json({message:'supporter retrived successfully',supporter})

}catch(error){
    console.error('failed to fecth supporter',error);
    return res.status(500).json({error:'failed to fecth supporter'})
}
}


const editsupporter= async(req,res)=>{
    try{
        const {id}=req.params;
       // const update =req.body;
       const { name, relationship, hasAccess, accessPermissions } = req.body;
        const existingSupporter = await SupporterSurvey.findById(id);
        if(!existingSupporter){
            return res.status(404).json({error:'Supporter not found'})
        }

        const update_supportersurvey = await SupporterSurvey.findByIdAndUpdate(
            id,
            //update,
            { name, relationship, hasAccess, accessPermissions },
            {new:true,runvalidator:true}
        );
             
        return res.status(200).json({message:'supporter updated successfully',update_supportersurvey })
    }catch(error){
        console.error('failed to edit supporters');
        return res.status(500).json({error:'failed to update supporter'})
    }
}

const deletesupporter = async(req,res)=>{
    try{
      const {id}= req.params;
      const existing_supporter= await SupporterSurvey.findById(id);
      if(!existing_supporter){
        return res.status(404).json({error:'Supporter not found'});
      }
      const deleted_Supporter = await SupporterSurvey.findByIdAndDelete(id);
      if (!deleted_Supporter) {
         return res.status(404).json({ error: "Supporter not found or already deleted" });
        }

       return res.status(200).json({message:'Supporter deleted successfully',deleted_Supporter})
    }catch(error){
        console.error('failed to delete supporter',error);
        return res.status(500).json({error:'failed to delete supporter'});
    }
}


module.exports = {createsurvey ,update_momsurvey,getAllSurveys,getbyid_momsurvey,delete_momsurvey,
    generateReferralPin,deleteallsurveys,addsupport,getSupporterbyid,getallSupporters,editsupporter,deletesupporter} 



    // const createsurvey = async (req, res) => {
    //     try {
    //       const {
    //         user_name,
      
    //         // generalDetails
    //         first_name,
    //         last_name,
    //         dob,
    //         gender,
    //         nationality,
    //         Phonenumber,
    //         email,
    //         country,
    //         Addressline1,
    //         Addressline2,
    //         city,
    //         State,
    //         Zip_code,
      
    //         // pregnancyStatus
    //         currentlyPregnant,
    //         Last_menstrualperiod,
    //         estimatedDueDate,
    //         PregnancyLoss,
    //         firstChild,
      
    //         // healthCare
    //         hasPrimaryCarePhysician,
    //         hasOBGYN,
    //         insuranceProvider,
    //         medications,
    //         consumesAlcoholOrSmokes
    //       } = req.body;
      
    //       // 🔍 Required fields check
    //       const requiredFields = {
    //         user_name,
    //         first_name,
    //         last_name,
    //        // age,
    //         dob,
    //         gender,
    //         nationality,
    //         Phonenumber,
    //         email,
    //         country,
    //         Addressline1,
    //        // Addressline2,
    //         city,
    //         State,
    //         Zip_code
    //       };
      
    //       const missingFields = Object.entries(requiredFields)
    //         .filter(([_, value]) => value === undefined || value === null || value === "")
    //         .map(([key]) => key);
      
    //       if (missingFields.length > 0) {
    //         return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
    //       }
      
    //       // ✅ Create new Survey
    //       const newSurvey = new Survey({
    //         user_name,
    //         generalDetails: {
    //           first_name,
    //           last_name,
    //          // age,
    //           dob,
    //           gender,
    //           nationality,
    //           Phonenumber,
    //           email,
    //           country,
    //           Addressline1,
    //           Addressline2,
    //           city,
    //           State,
    //           Zip_code
    //         },
    //         pregnancyStatus: {
    //           currentlyPregnant,
    //           Last_menstrualperiod,
    //           estimatedDueDate,
    //           PregnancyLoss,
    //           firstChild
    //         },
    //         healthCare: {
    //           hasPrimaryCarePhysician,
    //           hasOBGYN,
    //           insuranceProvider,
    //           medications,
    //           consumesAlcoholOrSmokes
    //         }
    //       });
      
    //       await newSurvey.save();
    //       res.status(200).json({ message: "Survey submitted successfully!", survey: newSurvey });
      
    //     } catch (error) {
    //       console.error("Survey submission failed:", error);
    //       res.status(500).json({ error: "Failed to save survey data" });
    //     }
    //   };















    // const createsurvey = async (req, res) => {
    //     try {
    //         const {
    //           full_name,
    //             age,
    //             gender,
    //             nationality,
    //             generation,
    //             currentlyPregnant,
    //             pregnancyWeeks,
    //             estimatedDueDate,
    //             firstPregnancy,
    //             hasProvider,
    //             prenatalServices,
    //             healthcareSystem,
    //             navigationExperience,
    //             culturalChallenges,
    //             preferredLanguage,
    //             dietaryPreferences,
    //             physicalActivity,
    //             primaryInfoSource,
    //             expectations,
    //             challenges,
    //             wantsPersonalizedResources,
    //             additionalComments,
    //             user_name
    //         } = req.body;
      
    //         // 🔍 Define all required fields
    //         const requiredFields = {
    //            full_name,age, gender,nationality, generation
    //         };
      
    //         // 🚨 Check for missing fields
    //         const missingFields = Object.entries(requiredFields)
    //             .filter(([key, value]) => value === undefined || value === null || value === "")
    //             .map(([key]) => key);
      
    //         if (missingFields.length > 0) {
    //             return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
    //         }
      
    //         // ✅ Creating a new survey response object
    //         const newSurvey = new Survey({
    //           user_name,
    //             generalDetails: { full_name,age, gender,nationality, generation },
    //             pregnancyStatus: { currentlyPregnant, pregnancyWeeks, estimatedDueDate, firstPregnancy },
    //             healthCare: { hasProvider, prenatalServices, healthcareSystem, navigationExperience, culturalChallenges },
    //             lifestylePreferences: { preferredLanguage, dietaryPreferences, physicalActivity, primaryInfoSource },
    //             experienceAndExpectations: { expectations, challenges, wantsPersonalizedResources, additionalComments }
    //         });
      
    //         await newSurvey.save();
    //         res.status(200).json({ message: "Survey submitted successfully!", survey: newSurvey });
      
    //     } catch (error) {
    //         console.error("Survey submission failed:", error);
    //         res.status(500).json({ error: "Failed to save survey data" });
    //     }
    //   };
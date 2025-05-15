const express = require ('express');
const {Survey,SupporterSurvey} = require('../model/momsurvey');
const mongoose= require('mongoose');
const User = require('../model/User')



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
            userId,
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
            userId,
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


module.exports = {
    generateReferralPin,addsupport,getSupporterbyid,getallSupporters,editsupporter,deletesupporter} 










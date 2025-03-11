const express = require('express');
const {momAndSupportMiddleware} =require('../middleware/authMiddleware')
const {createsurvey,update_momsurvey,delete_momsurvey,getbyid_momsurvey, getAllSurveys,addsupport,getSupporterbyid,
    getallSupporters,editsupporter,deletesupporter}=require('../controller/momsurvey_controller')

const momsurvey_router = express.Router();

momsurvey_router.post('/survey',createsurvey);
momsurvey_router.put('/update/:id',update_momsurvey);
momsurvey_router.get('/all/surveys',getAllSurveys);
momsurvey_router.get('/survey/:id',getbyid_momsurvey);
momsurvey_router.delete('/delete/:id',delete_momsurvey);
momsurvey_router.post('/supporter',addsupport);
momsurvey_router.get('/supporter/:id',getSupporterbyid);
momsurvey_router.get('/all/supporters',getallSupporters)
momsurvey_router.put('/updatesupporter/:id',editsupporter)
momsurvey_router.delete('/supporter/:id',deletesupporter)

module.exports=momsurvey_router
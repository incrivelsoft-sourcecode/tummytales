const express = require('express');
const {momAndSupportMiddleware} =require('../middleware/authMiddleware')
const {createsurvey,update_momsurvey,delete_momsurvey, getAllSurveys}=require('../controller/momsurvey_controller')

const momsurvey_router = express.Router();

momsurvey_router.post('/survey',createsurvey);
momsurvey_router.put('/update/:id',update_momsurvey);
momsurvey_router.get('/all/surveys',getAllSurveys);
momsurvey_router.delete('/delete/:id',delete_momsurvey)
module.exports=momsurvey_router
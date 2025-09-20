const express = require('express');
const {authorizeMommiddleware,momAndSupporterMiddleware} =require('../middleware/authMiddleware')
const {createsurvey,update_momsurvey,delete_momsurvey,
    get_momsurvey, getAllSurveys}=require('../controller/momsurvey_controller')


const momsurvey_router = express.Router();

momsurvey_router.post('/survey',momAndSupporterMiddleware,createsurvey);
momsurvey_router.put('/update',momAndSupporterMiddleware,update_momsurvey);
momsurvey_router.get('/all/surveys',momAndSupporterMiddleware,getAllSurveys);
momsurvey_router.get('/survey',momAndSupporterMiddleware,get_momsurvey);
momsurvey_router.delete('/alldel',delete_momsurvey)

module.exports=momsurvey_router





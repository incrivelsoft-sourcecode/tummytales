const express = require('express');
const {authorizeMommiddleware,momAndSupporterMiddleware} =require('../middleware/authMiddleware')
const {createsurvey,update_momsurvey,delete_momsurvey,getbyid_momsurvey, getAllSurveys,
    deleteallsurveys}=require('../controller/momsurvey_controller')


const momsurvey_router = express.Router();

momsurvey_router.post('/survey',momAndSupporterMiddleware,createsurvey);
momsurvey_router.put('/update/:id',momAndSupporterMiddleware,update_momsurvey);
momsurvey_router.get('/all/surveys',momAndSupporterMiddleware,getAllSurveys);
momsurvey_router.get('/survey/:id',momAndSupporterMiddleware,getbyid_momsurvey);
momsurvey_router.delete('/delete/:userId',momAndSupporterMiddleware,delete_momsurvey);

momsurvey_router.delete('/alldel',deleteallsurveys)

module.exports=momsurvey_router




// const express = require('express');
// const {momAndSupportMiddleware,authorizeMommiddleware} =require('../middleware/authMiddleware')
// const {createsurvey,update_momsurvey,delete_momsurvey,getbyid_momsurvey, getAllSurveys,
//     deleteallsurveys}=require('../controller/momsurvey_controller')

// const momsurvey_router = express.Router();

// momsurvey_router.post('/survey',authorizeMommiddleware,createsurvey);
// momsurvey_router.put('/update/:id',authorizeMommiddleware,update_momsurvey);
// momsurvey_router.get('/all/surveys',authorizeMommiddleware,getAllSurveys);
// momsurvey_router.get('/survey/:id',authorizeMommiddleware,getbyid_momsurvey);
// momsurvey_router.delete('/delete/:userId',authorizeMommiddleware,delete_momsurvey);
// // momsurvey_router.post('/generate-referral-pin',generateReferralPin)
// // momsurvey_router.post('/supporter',authorizeMommiddleware,addsupport);
// // momsurvey_router.get('/supporter/:id',authorizeMommiddleware,getSupporterbyid);
// // momsurvey_router.get('/all/supporters',authorizeMommiddleware,getallSupporters)
// // momsurvey_router.put('/updatesupporter/:id',authorizeMommiddleware,editsupporter)
// // momsurvey_router.delete('/supporter/:id',authorizeMommiddleware,deletesupporter)

// momsurvey_router.delete('/alldel',deleteallsurveys)

// module.exports=momsurvey_router
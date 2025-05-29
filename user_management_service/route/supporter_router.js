const express = require('express');
const {momAndSupporterMiddleware, momMiddleware} = require('../middleware/authMiddleware.js');
const { referSupporter,
  getReferals, deleteReferal,editReferal,
 } = require('../controller/support_controller.js');
const passport = require("passport");

const router = express.Router();

//supporter apis
router.post("/send-referels", momMiddleware, referSupporter);
router.get("/referals", momMiddleware, getReferals);
router.put("/edit-referals",momMiddleware,editReferal);
router.delete("/deletereferals",momMiddleware,deleteReferal);



module.exports = router;

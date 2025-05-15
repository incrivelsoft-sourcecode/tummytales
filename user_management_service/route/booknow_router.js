const express = require('express');
const {momAndSupporterMiddleware,authorizeMommiddleware} =require('../middleware/authMiddleware')
const booknow_router = express.Router();
const {
  createBookNow,
  getBookNow,
  updateBookNow,
  deleteBookNow
} = require('../controller/booknow_controller');

booknow_router.post('/add',momAndSupporterMiddleware, createBookNow); // create a new book now popup
booknow_router.get('/get', getBookNow);     // get by name (via query) or get all
booknow_router.put('/edit/:name', updateBookNow); // update by name
booknow_router.delete('/del/:name', deleteBookNow); // delete by name

module.exports = booknow_router;

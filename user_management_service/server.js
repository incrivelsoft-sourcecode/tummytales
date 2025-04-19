const express = require("express");
const cors = require('cors');
const dotenv  = require('dotenv');
const session  = require('express-session');
const passport  = require('passport');
require("./utils/passport.js");
const connectDB = require('./config/db.js');

//require('../user_management_service/thali/controller/mealscheduel.js')
const userRouter  = require('./route/userRoutes.js');
const momsurvey_router=require('./route/momsurvey_router.js');
const askai_router = require("./route/askai_router.js");


const port = process.env.DB_PORT || 3000;  

dotenv.config();

const app = express();

app.use(cors({ origin: ["http://54.163.147.226:3000", "http://localhost:3000", "https://tummytales.info"] }));


app.use(express.json({ limit: '6mb' }));

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 413) {
    res.status(413).send({ error: 'Payload too large!' });
  } else {
    next(err);
  }
});




app.use('/user/users', userRouter);
app.use('/user/mom',momsurvey_router)
app.use('/user/ai',askai_router)


app.get("/", (req, res) => {
  res.status(200).send(`Server running upon the port : ${port}`);
})



app.listen(port, async () => {
  console.log(`Server Started on port ${port}`);
  await connectDB();
  //require('../user_management_service/thali/controller/mealscheduel.js');
  const currentDate = new Date();
  currentDate.setMinutes(currentDate.getMinutes() + 5);
  console.log(currentDate);
 
});


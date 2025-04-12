const express = require("express");
const cors = require('cors');
const dotenv  = require('dotenv');
const AImeal_router = require('./router/ai_meal_router.js')

const connectDB = require('./config/db.js');

const port = process.env.DB_PORT || 4000;  

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: ["https://tummytales-alpha.vercel.app", "http://localhost:3000", "http://localhost:3001"] }));


app.use('/ai',AImeal_router)





app.listen(port, async () => {
  console.log(`Server Started on port ${port}`);
  await connectDB();
  require('./controller/mealscheduel.js')
});

const express = require("express");
const cors = require('cors');
const dotenv  = require('dotenv');

const connectDB = require('./config/db.js');

const askai_router = require("./route/askai_router.js");
const port = process.env.DB_PORT || 7001;  

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: ["https://tummytales-alpha.vercel.app", "http://localhost:3000", "http://localhost:3001"] }));


app.use('/ai',askai_router)


app.get('/askamma', (req, res) => {
  res.send('Askamma route is working!');
});



app.listen(port, async () => {
  console.log(`Server Started on port ${port}`);
  await connectDB();
});

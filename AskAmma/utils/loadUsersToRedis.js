// const User = require("../model/User.js");
// const redisClient = require("../config/redisClient");

// const loadUsersToRedis = async () => {
//   try {
//     console.log("⏳ Loading users from MongoDB to Redis...");
//     const users = await User.find({}, "user_name"); // Fetch usernames only

//     users.forEach((user) => {
//       redisClient.set(`username:${user.user_name}`, "true"); // Store usernames
//     });

//     console.log("✅ Users loaded into Redis!");
//   } catch (error) {
//     console.error("❌ Error loading users into Redis:", error);
//   }
// };


// loadUsersToRedis();

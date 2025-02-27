const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
	try {
	
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB Connected: ${conn.connection.host}`);

		mongoose.connection.on('connected', () => {
			console.log('Mongoose connected to DB');
		});

		mongoose.connection.on('error', (err) => {
			console.error(`Mongoose connection error: ${err.message}`);
		});

		mongoose.connection.on('disconnected', () => {
			console.warn('Mongoose disconnected. Attempting to reconnect...');
			reconnectDB();
		});
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
};

const reconnectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log('Mongoose reconnected to DB');
	} catch (error) {
		console.error(`Reconnection error: ${error.message}`);
		setTimeout(reconnectDB, 5000);
	}
};

module.exports = connectDB;
 
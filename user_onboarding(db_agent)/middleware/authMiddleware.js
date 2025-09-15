const jwt = require('jsonwebtoken');
//const UserDetails=require('../model/User')

const momMiddleware = (req, res, next) => {
	const token = req.header('Authorization')?.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'No token, authorization denied' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // Attach user info to request object
		if (decoded.role !== "mom") {
			return res.status(403).json({ message: "Access denied. Supporters only." });
		}
		next(); // Proceed to the next middleware or route handler
	} catch (err) {
		res.status(401).json({ message: 'Token is not valid' });
	}
};

const supporterMiddleware = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "No token, authorization denied" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		
		if (decoded.role !== "supporter") {
			return res.status(403).json({ message: "Access denied. Supporters only." });
		}
		req.user = decoded;
		next();
	} catch (err) {
		res.status(401).json({ message: "Token is not valid" });
	}
};
//main
const momAndSupporterMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "supporter" && decoded.role !== "mom") {
      return res.status(403).json({ message: "Access denied. Moms or Supporters only." });
    }

    req.user = {
      id: decoded.userId, // normalized id
      role: decoded.role,
      email: decoded.email || null,
      name: decoded.user_name || null,
      permissions: decoded.permissions || [],
      effectiveUserId:
        decoded.role === "supporter" && decoded.referal_code
          ? decoded.referal_code
          : decoded.userId,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};



const authorizeMommiddleware = async (req, res, next) => {
	try {
	  // Read from query (GET/DELETE) or body (POST/PUT)
	  const data = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body;
  
	  const userId = data.userId;
	  const user_name = data.user_name;
  
	  if (!userId && !user_name) {
		return res.status(400).json({ message: 'userId or user_name is required' });
	  }
  
	  let user = null;
	 
		  if (userId) {
			  user = await UserDetails.findById(userId);
			  if (!user) return res.status(404).json({ message: 'User with this userId not found' });
			  req.body.userId = userId; // Inject for controller use
			  console.log('User ID:', userId);
		  }
	  if (user_name) {
		req.body.user_name = user_name;
		console.log('User Name:', user_name);
	  }
  
	  next();
	} catch (error) {
	  console.error('Error in user authorization', error);
	  next(error);
	}
  };
  


module.exports = { momAndSupporterMiddleware, supporterMiddleware, momMiddleware,authorizeMommiddleware }



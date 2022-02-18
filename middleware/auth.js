const User = require("../model/user");
const jwt = require('jsonwebtoken');

var dotenv = require('dotenv');
dotenv.config({path: '../config/config.env'})




exports.isAuthenticated = async(req,res, next)=>{

    const {token} = req.cookies;
    if(!token){
        return res.status(401).json({
            message:"please login first"
        });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded._id);
    next();
};



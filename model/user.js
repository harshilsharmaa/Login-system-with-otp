const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

var dotenv = require('dotenv');
// load config
dotenv.config({path: '../config/config.env'})

const userSchema = mongoose.Schema({

    number:{
        type:Number,
        required: true
    },
    name:{
        type:String,
        required: true
    },
    password:{
        type:String,
        required:true
    },
    bio:{
        type:String
    },
    profileImage:{
        type:String
    }
}, {timestamps: true});

userSchema.methods.generateJWT = function(){
    const token = jwt.sign({
        _id: this._id,
        number: this.number
    }, process.env.JWT_SECRET, {expiresIn: "5d"});
    return token;
}

userSchema.pre('save', async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 12);
    }

    next();
});

userSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateToken = async function(){
    return jwt.sign({_id: this._id}, process.env.JWT_SECRET)
}

    
module.exports= mongoose.model('User', userSchema);
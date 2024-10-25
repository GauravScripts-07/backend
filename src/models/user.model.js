import {mongoose , Schema} from "mongoose";

import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            unique:true,
            lowecase:true,
            trim: true,
            index: true
        },
        email:{
            type: String,
            required: true,
            unique:true,
            lowecase:true,
            trim: true
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String,
            required: true,
        },
        coverImage:{
            type: String,

        },
        watchHistory:[
            {
                type:String,
                ref:"video"
            }

        ],
        password:{
            type:String,
            required: [true,'Password is required']
        },
        refreshToken:{
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 8);
        next();
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});



userSchema.methods.isPasswordCorrect = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw new Error("Password comparison failed");
    }
};


userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        { // payload
            _id : this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
            
        },
        // secret or private key
        process.env.ACCESS_TOKEN_SECRET,
        {  // [option , callback ]
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}





export const User = mongoose.model("User",userSchema)
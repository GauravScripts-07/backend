import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import jsonwebtoken from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(400,"unathorized login request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken);
        const user =  await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
        req.user = user;
        next();
        
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
    }
})
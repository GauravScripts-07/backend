import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {UploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import createApplication from "express/lib/express.js";
import mongoose, { mongo } from "mongoose";



//generating access and refresh token
const generateAccessTokenAndRefreshToken = async (userId) => {
//console.log(userId);
    try{
        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(404,"user not found, cannot generate access token")
        }
        const accessToken = user.generateAccessToken();
        if(!accessToken){
            throw new ApiError(400,"could not generate access Token");
        }
        console.log("access token is being generated",accessToken)
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken}
    }                 
    catch(error){
       // console.log("Error is ",error)
        throw new ApiError(500,"something went wrong while generating refresh and access token");
    }
}



//register controller to register user
const registerUser = asyncHandler ( async (req , res ) => {
    // res.status(200).json({
    //     message: "Ok This user registration has successfully done.."
    // })

     /* 
    get user details from frontend
    validation - not empty
    check if user already exists : username , email
    check for images, check for avatar
    upload them to cloudinary, avatar
    create user object - create entry in db
    remove password and refresh token field from response
    check for user creation
    return response
    */

    const {fullName, username, email,password} = req.body
    
    // can use if else below to check validation but this is pro code as per industry standards
    if([fullName,email,username,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    } 
    

    const existedUser = await User.findOne({ //checking if same email or username exists
        $or: [{ username } , { email }]
    })
    if(existedUser){
        throw new ApiError(409,"This username or email already exists")
    }
    const avatarLocalPath = req.files?.avatar[0].path;   

    //const coverImageLocalPath = req.files?.coverImage[0].path;
    //console.log(avatarLocalPath);

   // console.log(` Testing for data above is it was sent throgh postman`,fullName, username, email,password)

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar error while getting local path")
    }   

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    const avatar = await UploadOnCloudinary(avatarLocalPath)
    const coverImage = await UploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400,"Avatar error on uploading file to cloudinary") 
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,  
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select( // check if user is created
        "-password -refreshToken "
    )
    if(!createdUser){
        throw new ApiError(500,"Error while we register user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered succesfully ")
    )
})





// login A user and sending cookies 
const loginUser = asyncHandler (async (req , res )=>{
    // req body -> data
    // check if username or email is being sent 
    // find the user (checking if user exists)
    // password check
    // access token and refresh token
    // send cokie
    const {username,email,password} = req.body;
    if(!(username || email) ){
        throw new ApiError(400,"Username or Email is required");
    }
    
    const user = await User.findOne({
        $or: [{username }, {email }]
    }  
)
if(!user){
    throw new ApiError(404,"User not found")
}

// Remember "User" is imported from mongoose so it contains functions of that only 
// if we want to user bicrypt to check password we need to use "user" we created

const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new ApiError(401,"Incorrect Password")
}

const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)


//optional step
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

// to send cookies 
const options = {
        httpOnly: true, // cookies are modified by frontend also, to modifiy it from server only we use these options
        secure: true
    }
    
    // sending cookies
    return res.status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})





// logout user 
const logoutUser = asyncHandler(async(req,res)=>{
     await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true //return me response new wala aayega
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))
})




//Access token validation and refreshing for user
const refreshAccessToken = asyncHandler(async(req , res )=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorised request")
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = User.findById(decodedToken?._id)
     if (!user) {
         throw new ApiError(404,"Invalid refresh token")
     }
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401,"Refresh token is expired or used ")
     }
     const options = {
         httpOnly: true,
         secure: true
     }
    const {accessToken , newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
 
     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken: newRefreshToken},
             "Access token refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
   }
})


//update detais controllers ----------------


const changePassword = asyncHandler( async(req , res )=>{
    const {oldPassowrd , newPassword } = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassowrd)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid Password")
    }

    user.password =  newPassword
    await user.save({validateBeforeSave : false })

    return res.
    status(200)
    .json(new ApiResponse(200, {} , "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async(req , res)=> {
    return res.
    status(200)
    .json(new ApiResponse(200 , req.user , "current user fetched successfully")) 
})

const updateUserDetails = asyncHandler( async(req ,res) =>{
    const {fullName , email} = req.body
    if (!( fullName || email )) {
        throw new ApiError(400,"All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { // aggregation, set recieves an object and we give it a parameter
                fullName,
                email

            }
        },
        {new : true} // return the information after update
    ).select("-password")

    return res.
    status(200)
    .json(new ApiResponse(200, {user}, "Account details updated successfully"))
})

//updating Avatar
const updateUserAvatar = asyncHandler (async (req,res)=>{
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await UploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading on cloudinary")
    }

    //updating details
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.
    status(200)
    .json( new ApiResponse(200, user , "Avatar updated successfully"))
})

//updating coverImage 

const updateUserCoverImg = asyncHandler (async (req,res)=>{
    const coverImgLocalPath = req.file?.path;
    if (!coverImgLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }
    const coverImage = await UploadOnCloudinary(coverImgLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading cover image on cloudinary")
    }

    //updating details
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res.
    status(200)
    .json( new ApiResponse(200, user , "cover image updated successfully"))
})


// writing MongoDB aggregation
const getUserChannelProfile = asyncHandler( async (req, res)=>{
    const {username} = req.params //this gets user from URL and not from body
    if (!username?.trim()) {
        throw new ApiError(400,"Username is missing in getUserChannelProfile method")
    }

    // writing MongoDB aggregation

    const channel = await User.aggregate([// takes an array then further objects
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers" //$ represents that it is a field so we can further add conditions
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if{$in:[req.user?._id,"$subscribers.subscriber"]},  //$subscribers is field and subscriber is schema in mongoose model
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{  //projection for sending selected things and for that we put 1 for true flag
                fullName:1,
                username:1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar:1,
                coverImage:1,
                email:1
            }

        }
    ]) 
    console.log(channel)

    if (!channel?.length) {
        throw new ApiError(400,"Channel does not exists")
    }

    return res.
    status(200)
    .json(
        new apiResponse(200, channel[0], "channel feteched successfully")
    )
})

const getWatchHistory =  asyncHandler( async (req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId("req.user._id")
            },
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from:"users"
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history getched successfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImg,
    getUserChannelProfile,
    getWatchHistory

}
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {UploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import createApplication from "express/lib/express.js";

const generateAccessTokenAndRefreshToken = async (userId) => {

    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforesave: false})

        return {accessToken, refreshToken}
    }                 
    catch(error){
        throw new apiError(500,"something went wrong while generating refresh token");
    }
}


//mongodb on laptop mishra acount on email
// cloudinary on gaurav account of laptop using google login
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
    // username or email
    // find the user (checking if user exists)
    // password check
    // access token and refresh token
    // send cokie
    const{username,email,password} = req.body;
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
    const loggedInUser = User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new apiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

// logout user

const logoutUser = asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new apiResponse(200,{},"user logged out"))
})
export {
    registerUser,
    loginUser,
    logoutUser

}
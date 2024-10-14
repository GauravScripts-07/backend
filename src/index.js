//require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import { app } from "./app.js";


dotenv.config({
    path:'./.env'
})


import connectDB from "./db/index.js";


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo DB connection failed : ",err);
})












// function connectDB(){

// }

// connectDB();

// immediately invoked function










// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
// const app=express()

// (async ()=>{
//     try  {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("Error",(error)=>{
//             console.log("error",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.port}`)
//         })



//     }catch(error){
//         console.error("Error: ",error);
//         throw error
//     }
// })()
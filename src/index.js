//require('dotenv').config({path: './env'})
import dotenv from "dotenv"

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})
connectDB()


// function connectDB(){

// }

// connectDB();

// immediately invoked function














// (async ()=>{
//     try  {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         application.on("Error",(error)=>{
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
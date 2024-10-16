import express from "express"
import cors from "cors"
import userRouter from './routes/user.routes.js'
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true
}))
app.use(express.json({limit:"10kb"}))
app.use(express.urlencoded({extended:true , limit: "10kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(express.json());



// importing router
// import { ApiError } from "./utils/apiError.js";
// app.use(ApiError)
// router declaration
app.use("/api/v1/users",userRouter)

  
export {app} 
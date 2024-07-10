import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";


const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true
}))
app.use(express.json({limit:"10kb"}))
app.use(express.urlencoded({extended:true , limit: "10kb"}))
app.use(express.static("public"))
app.use(cookieParser())




// importing router
import userRouter from './routes/user.routes.js'

// router declaration
app.use("api/v1/users",userRouter)

export {app}
import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber : {
        type : mongoose.Types.ObjectId, // the one who is subscribing means the user
        ref : "User" 
    },
    channel : {
        type : mongoose.Types.ObjectId, // the one whom channel belongs
        ref : "User" 
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)
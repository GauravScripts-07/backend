import { Router } from "express";
import { registerUser,loginUser,logoutUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {refreshAccessToken} from "../controllers/user.controller.js"
const router = Router();

router.route("/register").post(  // post me 2 parameter de rahe 1-> action if anything. 2-> route name
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),registerUser
);
// router.route("/demo").get(getUsers);
router.route("/login").post(loginUser) 


// secured route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
export default router 
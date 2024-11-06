import { Router } from "express";
import { registerUser,loginUser,logoutUser,changePassword,getCurrentUser,updateUserDetails,
    updateUserAvatar,updateUserCoverImg,getUserChannelProfile,getWatchHistory } from "../controllers/user.controller.js";
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
router.route("/logout").post(verifyJWT, logoutUser) //verified
router.route("/refresh-token").post(refreshAccessToken) //verfied
router.route("/change-password").post(verifyJWT,changePassword) //verified
router.route("/current-user").get(verifyJWT,getCurrentUser) //verified
router.route("/update-account").patch(verifyJWT,updateUserDetails) //verified
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar) //verfied
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImg) //verified
router.route("/c/:username").get(verifyJWT,getUserChannelProfile) //since we are using params ,, verified
router.route("/history").get(verifyJWT,getWatchHistory) // verified
export default router 
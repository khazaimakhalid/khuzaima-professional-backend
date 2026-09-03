import { Router } from "express";
import { loginUser, logOutUser, registerUser , updateUserAvatar, updateAccountDetails , currentUser ,refreshAccessToken, getWatchHistory , changePassword, updateUserCoverImage, getUserChannelProfile } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router  = Router()

router.route("/register").post(
    upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
    ]),
registerUser    
)


//secured routes
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJwt , logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/current-user").get(verifyJwt , currentUser)
router.route("/update-account").patch(verifyJwt , updateAccountDetails )
router.route("/avatar").patch(verifyJwt , upload.single("avatar") , updateUserAvatar)
router.route("/cover-image").patch(verifyJwt , upload.single("coverImage") , updateUserCoverImage)
router.route("/c/:username").get(verifyJwt , getUserChannelProfile)
router.route("/watch-history").get(verifyJwt , getWatchHistory)
 

  

export default router
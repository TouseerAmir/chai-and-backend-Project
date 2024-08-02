import { Router } from "express";
import {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory}
    from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { jwtVerfiy } from "../middlewares/Auth.middleware.js"; 
const router=Router();
router.route("/register").post(upload.fields(
    [
    {
        name:"avatar",
        macCount:1
    },
    {
        name:"coverImage",
        macCount:1
    }
    ]
)
,registerUser)
router.route("/login").post(loginUser);
router.route("/logout").post(jwtVerfiy,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(jwtVerfiy,changeCurrentPassword);
router.route("/get-user").get(jwtVerfiy,getCurrentUser);
router.route("/updateaccount-details").patch(jwtVerfiy,updateAccountDetails);
router.route("/change-avatar").patch(jwtVerfiy,upload.single("avatar"),updateUserAvatar);
router.route("/change-coverImage").patch(jwtVerfiy,upload.single("coverImage"),updateUserCoverImage);
router.route("/c/:username").get(jwtVerfiy,getUserChannelProfile);
router.route("/history").get(jwtVerfiy,getWatchHistory);
export default router
import { Router } from "express";
import {registerUser,loginUser,logoutUser,refreshAccessToken} from "../controllers/user.controller.js";
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
export default router
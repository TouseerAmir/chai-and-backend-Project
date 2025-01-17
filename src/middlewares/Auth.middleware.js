import { asyncHandler } from "../utils/Asynchandler.js";
import { ApiErrors } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
  export const jwtVerfiy=asyncHandler(async(req,_,next)=>{
        try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token) {
            throw new ApiErrors(401,"Unauthorized request");
        }
             const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
             const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
             if(!user) {
                throw new ApiErrors(401,"Invalid Access Token");
             }
             req.user=user
             next()
} catch (error) {
  throw new ApiErrors(401,error?.message || "Invalid access Token")  
}
})
import { asyncHandler } from "../utils/Asynchandler.js";
import { ApiErrors } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefereshTokens=async(userId)=>{
  try {
  const user=await User.findById(userId);
  if (!user) {
    console.error("User not found:", userId);
    throw new ApiErrors(404, "User not found");
  }
  const accessToken=user.generateAccessToken();
  const refreshToken=user.generateRefreshToken();
  console.log("Generate access and refresh token",{accessToken, refreshToken})
  user.refreshToken=refreshToken;
  await user.save({validateBeforeSave : false});
  return {accessToken, refreshToken};
  }
  catch(error) {
    throw new ApiErrors(500,"Something went wrong while generating access and refresh token");
  }
}
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  if (
    [username, fullName, email, password].some((field) =>
       field?.trim() === ""
    )
  ) {
    throw new ApiErrors(400, "All fields are required");
  }
    const existedUser=await User.findOne({
      $or: [{username},{email}]
    })
   //  console.log(existedUser);
    if(existedUser) {
      throw new ApiErrors(409,"User with this name and Email already exist");
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath) {
      throw new ApiErrors(400,"Avatar is required");
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar) {
      throw new ApiErrors(400,"Avatar is required");
    }
    const user=await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      password,
      email,
      username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
      "-password -refreshToken"
    )
    if(!createdUser) {
      throw new ApiErrors(500,"Something went wrong while registering the user ");
    }
    return res.status(201).json(
      new ApiResponse(200,createdUser,"User successfull Registered")
    )
  console.log("body:", req.body);
  console.log("req.files",req.files);
});
const loginUser=asyncHandler(async(req,res)=>{
  const {username,email,password}=req.body
  if(!username && !email) {
    throw new ApiErrors(400,"Email or Username is required");

  }
  const user=await User.findOne({
    $or:[{username},{email}]
  })
  if(!user) {
    throw new ApiErrors(401,"User is not registered");
  }
  const isPasswordValid=await user.isPasswordCorrect(password)
  if(!isPasswordValid) {
    throw new ApiErrors(404,"Invalid user credentials");
  }
  const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id);
console.log("Access and refresh ttoken",{ accessToken, refreshToken })
 if (!accessToken || !refreshToken) {
   throw new ApiErrors(500, "Failed to generate access or refresh token");
 }

  const loggedInUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )
  const options={
    httpOnly:true,
    secure:true

  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
    200,
    {
      user: loggedInUser ,accessToken ,refreshToken
    },
    "User loggin successfully"
  )
)
})
const logoutUser=asyncHandler(async (req,res)=>{
     await User.findByIdAndUpdate(
      req.user._id,{
        $set: {refreshToken: undefined}
      },
      {
        new: true
      }
     )
     const options={
      httpOnly:true,
      secure:true
  
    }
    return res
    .status(200)
    .clearCookie("accessTooken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"loggedout successfully"))
})
  const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken) {
      throw new ApiErrors(401,"Unauthorized Request");
    }
    try {
      const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
      const user=await User.findById(decodedToken?._id);
      if(!user) {
        throw new ApiErrors(401,"Invalid refresh token");
      }
      if(incomingRefreshToken !== user?.refreshToken) {
        throw new ApiErrors(401,"refresh token expired or used");
      }
      const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id);
      const options={
        httpOnly:true,
        secure:true
      }
      return res
      .status(200)
      .cookie("access Token",accessToken,options)
      .cookie("refresh Token",newRefreshToken,options)
      .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken:newRefreshToken},
          "Token Refreshed Successfully"
        )
      )
    } catch (error) {
       throw new ApiErrors(401,error?.message || "Invalid refresh Token");      
    }
  })
  const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword}=req.body;
    const user=await User.findById(user.req?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) {
      throw new ApiErrors(400,"old password incorrect");
    }
    user.password=newPassword;
    user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password change successfully"
      )
    )
  })
  const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
  })
  const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;
    if(!fullName || !email) {
      throw new ApiErrors(400,"Fullname and email is required");
    }
    const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          fullName,
          email
        }
      },
        {
          new: true
        }
      ).select("-password");
      return res
      .status(200)
      .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
      ))
  })
  const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath) {
      throw new ApiErrors(401,"Avatar file is missing");
    }
    const avatar=uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url) {
      throw new ApiErrors(401,"Error while uploading avatar");
    }
    const user=await findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          avatar:avatar.url
        }
      },
      {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Avatar Image updated successfully"
      )
    )
  })
  const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath) {
      throw new ApiErrors(401,"Cover image file is missing");
    }
    const coverImage=uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url) {
      throw new ApiErrors(401,"Error while uploading cover Image");
    }
    const user=await findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          coverImage:coverImage.url
        }
      },
      {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Cover Image updated successfully"
      )
    )
  })
export { registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage };

import { asyncHandler } from "../utils/Asynchandler.js";
import { ApiErrors } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
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
    const coverImageLocalPath=req.files?.avatar[0]?.path;
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
  console.log("email:", email);
});

export { registerUser };


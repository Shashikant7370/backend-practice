import { upload } from "../middlewares/multer.middleware.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFilesOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler( async (req , res) => {
  
  //logic building for our program


  //get the user details from the frontend
  //validations - not empty
  //check if user already exist  : username,email
  // check for image ,check for avatar
  //upload them to cloudinary : check avatar
  //create user object , create entry in db
  //remove password and refreshToken feild from response
  //check for user creation if yes return response

  const {fullname,email,username,password} = req.body;
  console.log("Email",email)
 

  //validations logic

  if([fullname,email,password,username].some((field)=>field?.trim() === "")){
    throw new ApiError(400,"All fields are required!!")
  }


  //check user exist or not

  const userExist = User.findOne(
    {
      $or : [{username},{email}]
    }
  )

  if(userExist){
    throw new ApiError(409,"User with username and email already exists.")
  }


  //check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;


  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required!!")
  }


  //upload on cloudinary
  const avatar  = await uploadFilesOnCloudinary(avatarLocalPath);
  const coverImage = await uploadFilesOnCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(400,"Avatar file is required!")
  }

  //creating object for user and entry in db
  const userObject  = await User.create({
        fullname,
        username:username.toLowerCase(),
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",

  })

  //remove password and refreshTOken
  const createdUser = await User.findById(userObject._id).select(
    "-password -refreshToken"
  )

  //check user is 
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering user!")
  }

  return res.status(201).json(
    new ApiResponse(200,"User registered successfully.",createdUser)
  )

});

export {registerUser}
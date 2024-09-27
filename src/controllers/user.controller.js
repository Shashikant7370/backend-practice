import { upload } from "../middlewares/multer.middleware.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFilesOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTOken = async (userId)=>{

  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false})

    return {refreshToken,accessToken}

  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating refresh and access token.")
  }
}

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
  console.log(req.body)
 

  //validations logic

  if([fullname,email,password,username].some((field)=>field?.trim() === "")){
    throw new ApiError(400,"All fields are required!!")
  }


  //check user exist or not

  const userExist = await User.findOne(
    {
      $or : [{username},{email}]
    }
  )

  if(userExist){
    throw new ApiError(409,"User with username and email already exists.")
  }


  //check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }


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

  //check user is created
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering user!")
  }

  return res.status(201).json(
    new ApiResponse(200,"User registered successfully.",createdUser)
  )

});

const loginUser = asyncHandler(async (req , res) =>{

  //req.body ->data
  //check for username and email
  //find the user
  //check for password
  //refresh or access token
  //send cookie -> refresh or access token
  //send response


  //get data from UI
  const {email,username,password} = req.body;
  console.log(email)
  if(!(username || email)){
    throw new ApiError(400,"Username or email is required")
  }

  const user = await User.findOne({
        $or: [{ username }, { email }]
  });

  if(!user){
    throw new ApiError(404,"User does not exist.")
  }


  const passwordValid = await user.isPasswordCorrect(password);

  if(!passwordValid){
    throw new ApiError(401,"Invalid user credentials.")
  }

  const {refreshToken,accessToken}=await generateAccessAndRefreshTOken(user._id)

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(loggedInUser);


  const options = {
    httpOnly:true,
    secure:true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged In successfully", {
       user: loggedInUser,refreshToken,
        accessToken,
      }),
    );

})

const userLogout = asyncHandler(async (req,res)=>{

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res.status(200)
  .clearCookie("accesstoken",accessToken,options)
  .clearCookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200,"User logged out",{}))
  
})


const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    try {
      if(!incommingRefreshToken){
        throw new ApiError(401,"Unauthorized user.")
      }
  
      const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
      const user  = await User.findById(decodedToken?._id)
  
      if(!user){
        throw new ApiError(401,"Invalid user")
      }
  
      if(incommingRefreshToken!== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired and used.")
      }
  
      const options ={
        httpOnly:true,
        secure:true
      }
  
      const {accessToken,newRefreshToken}=await generateAccessAndRefreshTOken(user._id)
  
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
        new ApiResponse(200,
          "Access token refreshed",
          {
            accessToken,refreshToken:newRefreshToken,
          },
        )
      )
    } catch (error) {
      throw new ApiError(401,"Invalid access token")
    }
})

export { registerUser, loginUser, userLogout,refreshAccessToken };
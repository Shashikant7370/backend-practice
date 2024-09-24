import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

  // Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadFilesOnCloudinary = async function(localFilePath){
    try {
        if (!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
          resource_type: "auto",
        });

        console.log("File is uploaded successfully on cloudinary ",response.url)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); //unlick the locally saved temporary file as upload operation got failed

        console.log("File does not uploaded!!",error)

        return null;
    }
}

export {uploadFilesOnCloudinary}

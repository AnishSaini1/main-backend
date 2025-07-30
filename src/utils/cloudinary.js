// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"


// cloudinary.config({ 
//         cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//         api_key: process.env.CLOUDINARY_API_KEY, 
//         api_secret: process.env.CLOUDINARY_API_SECRET 
//     });



// const uploadOnCloudinary = async (localFilePath)=>{
//     try {
//         if (!localFilePath)return null 
//         //upload the file on cloudinary 
//         const response = await cloudinary.uploader.upload(localFilePath,{
//                  resource_type : "auto"
//         })

//         //file has been uploaded successfuly 
//         console.log("File is uploaded on cloudinary", response.url);
//         fs.unlinkSync(localFilePath)
//         return response;

        
//     } catch (error) {

//         fs.unlinkSync(localFilePath)// remove the locally saved temporary fileas the upload operation got failed 
//         return null
        
//     }

// }

// export {uploadOnCloudinary}




// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;

//     // Upload file to Cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });

//     console.log("✅ File uploaded to Cloudinary:", response.url);

//     // ✅ Only delete if file exists
//     if (fs.existsSync(localFilePath)) {
//       fs.unlinkSync(localFilePath);
//     }

//     return response;
//   } catch (error) {
//     console.error("❌ Cloudinary Upload Failed:", error.message);

//     // ✅ Try to delete only if it exists
//     if (fs.existsSync(localFilePath)) {
//       fs.unlinkSync(localFilePath);
//     }

//     return null;
//   }
// };

// export { uploadOnCloudinary };



const uploadOnCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" }, 
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export { uploadOnCloudinary };

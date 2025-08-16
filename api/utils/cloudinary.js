import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// export const uploadToCloudinary = async (file, folder) => {
//   try {
//      const result = await cloudinary.uploader.upload(file.path, {
//       folder: folder || 'uploads' // Specify folder in Cloudinary
//     });
//     return result.secure_url;
//   } catch (error) {
//     console.log(error);
//     throw new Error("Cloudinary upload failed: " + error.message);
//   }
// };


export const uploadToCloudinary = async (file, folder) => {
  try {
    // Handle different file input types
    let filePath;
    if (file.path) {
      // From multer disk storage
      filePath = file.path;
    } else if (file.buffer) {
      // From memory storage
      filePath = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    } else {
      throw new Error('Invalid file format - no path or buffer found');
    }

    console.log('File before Cloudinary:', {
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    });

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder || 'uploads',
      resource_type: 'auto' // Handles both images and videos
    });

    
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error("Cloudinary upload failed: " + error.message);
  }
};

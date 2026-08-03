import { v2 as cloudinary } from "cloudinary";

import { config } from "dotenv";

console.log("Cloud name:", JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME));
console.log("API key:", JSON.stringify(process.env.CLOUDINARY_API_KEY));
console.log("API secret:", JSON.stringify(process.env.CLOUDINARY_API_SECRET));

config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, 
});

export default cloudinary;
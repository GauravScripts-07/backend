import { v2 as cloudinary} from "cloudinary";
//import exp from "constants";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View Credentials' below to copy your API secret
    // dfaiyresuifeurjkhfnfjsruiegnbalkghklgdh
});

const UploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        })
        console.log("cloudinary pe upload hai re baba",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)// remove the locally saved temporary file as the upload file got failed
        return null
    }
}
export {UploadOnCloudinary} 
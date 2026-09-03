import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.cloudinary_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
})

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            return null
        }

        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })

        console.log("FILE UPLOADED ON CLOUDINARY:", response.secure_url)
        fs.unlinkSync(filePath)
        return response

    } catch (error) {

        console.log(" CLOUDINARY ERROR:", error)

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        return null
    }
}

export { uploadOnCloudinary }
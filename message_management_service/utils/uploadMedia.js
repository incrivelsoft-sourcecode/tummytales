const cloudinary = require("../cloudinary/config.js");

const uploadMedia = async (fileBuffer, mimetype, originalFilename) => {
    try {
        if (!fileBuffer || !mimetype || !originalFilename) {
            throw new Error("No file data received");
        }

        // Determine the resource type
        let resourceType = "auto";
        if (mimetype.includes("image")) {
            resourceType = "image";
        } else if (mimetype.includes("video")) {
            resourceType = "video";
        } else if (mimetype.includes("audio")) {
            resourceType = "video"; // Audio files use 'video' resource type
        } else {
            resourceType = "raw"; // For other files (PDF, DOCX, etc.)
        }

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    public_id: originalFilename,
                    use_filename: true,
                    unique_filename: false,
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary Upload Error:", error.message);
                        reject(new Error("Failed to upload media"));
                    } else {
                        resolve(result.secure_url);
                    }
                }
            ).end(fileBuffer);
        });

    } catch (error) {
        console.error("Error in uploadMedia:", error.message);
        return null;
    }
};

module.exports = uploadMedia;
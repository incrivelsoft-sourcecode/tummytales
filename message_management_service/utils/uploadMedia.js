const cloudinary = require("../cloudinary/config.js");

const uploadMedia = async (fileBuffer, mimetype) => {
    try {
        if (!fileBuffer || !mimetype) {
            throw new Error("No file data received");
        }

        // Use "auto" to let Cloudinary detect the file type
        const resourceType = "auto";

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: resourceType },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary Upload Error:", error.message);
                        reject(new Error("Failed to upload media"));
                    } else {
                        // Append `fl_attachment=false` to the URL to force inline display
                        const url = `${result.secure_url}?fl_attachment=false`;
                        resolve(url);
                    }
                }
            );

            uploadStream.end(fileBuffer);
        });

    } catch (error) {
        console.error("Error in uploadMedia:", error.message);
        return null;
    }
};

module.exports = uploadMedia;

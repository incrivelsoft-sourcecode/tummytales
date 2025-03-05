const uploadMedia = async (req) => {
    try {
        let resourceType = "image"; // Default

        if (req.file.mimetype.startsWith("video")) {
            resourceType = "video";
        } else if (req.file.mimetype.startsWith("audio")) {
            resourceType = "raw"; // Cloudinary treats non-image/video files as "raw"
        } else if (["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(req.file.mimetype)) {
            resourceType = "raw";
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: resourceType,
        });

        let mediaURL = result.secure_url;
        return mediaURL;

    } catch (error) {
        console.log("Error in the uploadMedia, ", error);
        return null;
    }
}

module.exports = uploadMedia;
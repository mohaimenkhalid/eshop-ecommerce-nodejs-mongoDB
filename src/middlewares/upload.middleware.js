import multer from "multer";
import path from "path";
import fs from "fs";
const uploadService = require('../services/upload.service')

module.exports = ({
                           folder,
                           allowedMimeTypes = [],
                           maxFileSize = 5 * 1024 * 1024,
                       }) => {
    let storage;

    switch (uploadConfig.driver) {
        case "local":
            storage = multer.diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = `src/uploads/${folder}`;

                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }

                    cb(null, uploadPath);
                },

                filename: (req, file, cb) => {
                    const ext = path.extname(file.originalname);

                    cb(
                        null,
                        `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
                    );
                },
            });
            break;

        case "cloudinary":
        case "s3":
            storage = multer.memoryStorage();
            break;

        default:
            throw new Error("Invalid upload driver");
    }

    const fileFilter = (req, file, cb) => {
        if (
            allowedMimeTypes.length &&
            !allowedMimeTypes.includes(file.mimetype)
        ) {
            return cb(new Error("Invalid file type"));
        }

        cb(null, true);
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxFileSize,
        },
    });
};
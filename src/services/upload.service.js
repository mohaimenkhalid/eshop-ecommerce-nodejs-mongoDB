const uploadConfig = require("../config/upload.config");

const LocalStorage = require("./upload/local.storage");
// import CloudinaryStorage from "./cloudinary.storage.js";
// import S3Storage from "./s3.storage.js";

class UploadService {
    constructor() {
        switch (uploadConfig.driver) {
            case "local":
                this.provider = new LocalStorage();
                break;

            case "cloudinary":
                //this.provider = new CloudinaryStorage();
                break;

            case "s3":
                //this.provider = new S3Storage();
                break;

            default:
                throw new Error(`Unsupported upload driver: ${uploadConfig.driver}`);
        }
    }

    async uploadSingle(file, folder) {
        return this.provider.uploadSingle(file, folder);
    }

    async uploadMultiple(files, folder) {
        return this.provider.uploadMultiple(files, folder);
    }

    async deleteFile(fileIdentifier) {
        return this.provider.deleteFile(fileIdentifier);
    }
}

module.exports = new UploadService();
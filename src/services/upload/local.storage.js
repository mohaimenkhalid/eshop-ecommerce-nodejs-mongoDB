const fs = require("fs");
const path = require("path");


class LocalStorage {
    async uploadSingle(file, folder) {
        if (!file) return null;

        return {
            url: `/uploads/${folder}/${file.filename}`,
            filename: file.filename,
        };
    }

    async uploadMultiple(files, folder) {
        if (!files || files.length === 0) return [];

        return files.map((file) => ({
            url: `/uploads/${folder}/${file.filename}`,
            filename: file.filename,
        }));
    }

    async deleteFile(filePath) {
        if (!filePath) return;

        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            return;
        }
        await fs.promises.unlink(absolutePath);
    }
}

module.exports = LocalStorage;
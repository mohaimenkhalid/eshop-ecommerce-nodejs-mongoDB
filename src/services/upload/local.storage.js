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

    }
}

module.exports = LocalStorage;
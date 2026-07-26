const brandRepository = require('../repositories/brand.reporsitory');
const generateSlug = require('../utils/slugify')
const uploadService = require('../services/upload.service')

exports.create = async (req) => {
    try {
        const {name, isFeatured, status} = req.body;
        let uploadedImage = null;
        if(req.file) {
            uploadedImage = await uploadService.uploadSingle(req.file, "brands");
        }
        const payload = {
            name,
            slug: generateSlug(name),
            image: uploadedImage?.url,
            isFeatured,
            status,
        }
        await brandRepository.createBrand(payload)
    } catch (e) {
        if (req.file) {
            await uploadService.deleteFile(req.file.path)
        }
        throw e;
    }
}
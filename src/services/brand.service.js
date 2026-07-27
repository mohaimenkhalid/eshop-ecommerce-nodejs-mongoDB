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

exports.getPaginateBrands = async ({page, limit, name, status}) => {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {
        isDeleted: false,
    };

    if (name) {
        filter.name = {
            $regex: name,
            $options: "i",
        };
    }

    if (status) {
        filter.status = status;
    }

    return await brandRepository.getPaginateBrands({
        skip,
        limit: limitNumber,
        filter
    });
}

exports.getAllBrands = async () => {
    await brandRepository.getAllBrands();
}
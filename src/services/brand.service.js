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

    const [brands, total] = await Promise.all([
        brandRepository.getPaginateBrands({skip, limit: limitNumber, filter }),
        brandRepository.getTotalBrandCount(filter),
    ]);
    const totalPages = Math.ceil(total / limitNumber);
    return {
        data: brands,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasPrev: pageNumber > 1,
            hasNext: pageNumber < totalPages,
        }
    }
}

exports.getAllBrands = async () => {
    return await brandRepository.getAllBrands();
}
const brandRepository = require('../repositories/brand.reporsitory');
const {generateSlug} = require('../utils/slugify')
const uploadService = require('../services/upload.service')

exports.create = async (body) => {
    console.log(body)
    const {name, image, isFeatured, status} = body;
    let uploadedImage = null;
    if(image) {
        uploadedImage = await uploadService.uploadSingle(image, "brands");
    }
    const payload = {
        name,
        slug: generateSlug(name),
        image: uploadedImage,
        isFeatured,
        status,
    }

    brandRepository.createBrand(payload)
}
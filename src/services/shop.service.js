const mongoose = require('mongoose');
const shopRepository = require('../repositories/shop.repository');
const generateSlug = require('../utils/slugify');
const uploadService = require('../services/upload.service');
const createError = require('../utils/createError');

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

//multer .fields() gives { logo: [file], banner: [file] } - flatten it for cleanup
const flattenFiles = (files) => Object.values(files || {}).flat();

const removeUploadedFiles = async (files) => {
    await Promise.all(
        flattenFiles(files).map((file) => uploadService.deleteFile(file.path))
    );
}

const assertShopAccess = (shop, user) => {
    if (ADMIN_ROLES.includes(user?.role)) {
        return;
    }

    const ownerId = shop.owner?._id || shop.owner;

    if (String(ownerId) !== String(user?.userId)) {
        throw createError("You are not allowed to manage this shop", 403);
    }
}

exports.create = async (req) => {
    try {
        const {
            name,
            description,
            phone,
            email,
            isFeatured,
            status,
        } = req.body;

        const slug = generateSlug(name);
        const existingShop = await shopRepository.getShopBySlug(slug);

        if (existingShop) {
            throw createError("Shop name already exists", 409);
        }

        const [uploadedLogo, uploadedBanner] = await Promise.all([
            uploadService.uploadSingle(req.files?.logo?.[0], "shops"),
            uploadService.uploadSingle(req.files?.banner?.[0], "shops"),
        ]);

        const payload = {
            name,
            slug,
            owner: req.user.userId,
            description,
            logo: uploadedLogo?.url,
            banner: uploadedBanner?.url,
            phone,
            email,
            isFeatured,
            status,
        }

        return await shopRepository.createShop(payload);
    } catch (e) {
        //if failed to insert data in database then uploaded files removed from here
        await removeUploadedFiles(req.files);
        throw e;
    }
}

exports.update = async (id, body, files, user) => {
    try {
        const shop = await shopRepository.getShopById(id);

        if (!shop || shop.isDeleted) {
            throw createError("Shop not found", 404)
        }

        assertShopAccess(shop, user);

        const {
            name,
            description,
            phone,
            email,
            isFeatured,
            status,
        } = body;

        let payload = {};

        if (name) {
            const slug = generateSlug(name);
            const shopWithSlug = await shopRepository.getShopBySlug(slug);

            if (shopWithSlug && String(shopWithSlug._id) !== String(id)) {
                throw createError("Shop name already exists", 409);
            }

            payload.name = name;
            payload.slug = slug;
        }

        const [uploadedLogo, uploadedBanner] = await Promise.all([
            uploadService.uploadSingle(files?.logo?.[0], "shops"),
            uploadService.uploadSingle(files?.banner?.[0], "shops"),
        ]);

        if (uploadedLogo) {
            payload.logo = uploadedLogo.url;
        }

        if (uploadedBanner) {
            payload.banner = uploadedBanner.url;
        }

        if (typeof description !== "undefined") {
            payload.description = description || null;
        }

        if (phone) {
            payload.phone = phone;
        }

        if (typeof email !== "undefined") {
            payload.email = email || null;
        }

        if (typeof isFeatured !== "undefined") {
            payload.isFeatured = isFeatured;
        }

        if (status) {
            payload.status = status;
        }

        const updatedShop = await shopRepository.updateById(id, payload);

        //old images are only dropped once the update actually succeeded
        if (updatedShop) {
            if (uploadedLogo?.url && shop.logo) {
                await uploadService.deleteFile(`src${shop.logo}`)
            }

            if (uploadedBanner?.url && shop.banner) {
                await uploadService.deleteFile(`src${shop.banner}`)
            }
        }

        return updatedShop;
    } catch (e) {
        //if failed to update data in database then uploaded files removed from here
        await removeUploadedFiles(files);
        throw e;
    }
}

exports.getPaginateShops = async ({page, limit, name, status, isFeatured, owner}) => {
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

    if (typeof isFeatured !== "undefined" && isFeatured !== "") {
        filter.isFeatured = isFeatured === "true" || isFeatured === true;
    }

    if (owner) {
        filter.owner = owner;
    }

    const [shops, total] = await Promise.all([
        shopRepository.getPaginateShops({skip, limit: limitNumber, filter }),
        shopRepository.getTotalShopCount(filter),
    ]);
    const totalPages = Math.ceil(total / limitNumber);
    return {
        data: shops,
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

exports.getAllShops = async () => {
    return await shopRepository.getAllShops();
}

exports.getShopById = async (id) => {
    const shop = await shopRepository.getShopById(id);
    if (!shop || shop.isDeleted) {
        throw createError("Shop not found", 404);
    }

    return shop;
}

exports.delete = async (id, user) => {
    const shop = await shopRepository.getShopById(id);

    if (!shop) {
        throw createError("Shop not found", 404)
    }

    if (shop.isDeleted) {
        throw createError("Shop already deleted", 400);
    }

    assertShopAccess(shop, user);

    return await shopRepository.softDeleteById(id)
}

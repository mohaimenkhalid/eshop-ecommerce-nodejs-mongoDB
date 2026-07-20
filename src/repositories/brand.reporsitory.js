import Brand from '../models/brand.model';

exports.createBrand = (payload) => {
    const brand = new Brand(payload);
    return brand.save();
}
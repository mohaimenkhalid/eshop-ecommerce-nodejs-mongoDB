const createError = require('../utils/createError');

//coarse role gate - runs after authGuard, so req.user is already populated.
//resource level ownership stays in the service layer.
module.exports = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
        return next(createError("You do not have permission for this action", 403));
    }

    next();
};

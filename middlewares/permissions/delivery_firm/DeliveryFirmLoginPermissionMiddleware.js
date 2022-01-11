const ForbiddenException = require("../../../http/exceptions/ForbiddenException");
const User = require("../../../models/User");

module.exports = function(req, res, next) {
  if (req.data.deliveryFirm.user.status === User.STATUS_ACTIVE || req.data.deliveryFirm.user.status === User.STATUS_ACTIVATING) {
    next();
  } else {
    next(new ForbiddenException());
  }
}

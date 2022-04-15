const createHttpError = require("http-errors");
const User = require("../../../models/User");
const JWT = require("../../../security/JWT");

module.exports = function(req, res, next) {
  if (
    req.auth.authType === JWT.AUTH_CUSTOMER && 
    req.data.review.customer.id === req.auth.customerId && 
    req.data.review.customer.user.status === User.STATUS_ACTIVE
  ) {
    next();
  } else {
    next(createHttpError.Forbidden());
  }
}

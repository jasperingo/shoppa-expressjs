const { validationResult } = require("express-validator");
const createHttpError = require("http-errors");
const RouteLocationRepository = require("../../repository/RouteLocationRepository");
const RouteCustomErrors = require("./RouteCustomErrors");

module.exports = async function(req, res, next) {

  if (!validationResult(req).isEmpty()) {
    return next();
  }

  try {

    if (await RouteLocationRepository.existsByCityAndStateAndDeliveryRouteIdAndNotId(req.body, req.data.routeLocation)) {
      await RouteCustomErrors.cityAndStateInvalid(req);
    }
    
    next();

  } catch(error) {
    next(createHttpError.InternalServerError(error));
  }
}

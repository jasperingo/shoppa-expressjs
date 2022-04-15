const createHttpError = require("http-errors");
const CustomerRepository = require("../../repository/CustomerRepository");

module.exports = async function(req, res, next) {
  try {
    const customer = await CustomerRepository.get(req.params.id);
    if (customer) {
      req.data = { customer };
      next();
    } else {
      next(createHttpError.NotFound({
        data: {
          path: `${req.baseUrl}/${req.params.id}`,
          param: parseInt(req.params.id)
        }
      }));
    }
  } catch(error) {
    next(createHttpError.InternalServerError(error));
  }
}

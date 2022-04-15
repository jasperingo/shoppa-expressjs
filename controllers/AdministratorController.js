
const { StatusCodes } = require("http-status-codes");
const ResponseDTO = require("../utils/ResponseDTO");
const AdministratorRepository = require("../repository/AdministratorRepository");
const JWT = require("../security/JWT");
const Hash = require("../security/Hash");
const CustomerRepository = require("../repository/CustomerRepository");
const StoreRepository = require("../repository/StoreRepository");
const DeliveryFirmRepository = require("../repository/DeliveryFirmRepository");
const CategoryRepository = require("../repository/CategoryRepository");
const ProductRepository = require("../repository/ProductRepository");
const OrderRepository = require("../repository/OrderRepository");
const TransactionRepository = require("../repository/TransactionRepository");
const createHttpError = require("http-errors");

module.exports = class AdministratorController {

  async login(req, res, next) {

    try {
      
      const { administrator } = req.data;

      const token = await JWT.signAdminJWT(administrator.toJSON());

      administrator.hidePassword();

      const response = ResponseDTO.success(req.__('_login'), {
        administrator,
        api_token: token
      });

      res.status(StatusCodes.OK).send(response);

    } catch (error) {
      next(createHttpError.InternalServerError(error));
    }
  }

  async update(req, res, next) {

    try {
      
      await CustomerRepository.update(req.data.administrator.customer, req.body);

      const administrator = await AdministratorRepository.get(req.data.administrator.id);

      administrator.hidePassword();

      const response = ResponseDTO.success(req.__('_updated._administrator'), administrator);

      res.status(StatusCodes.OK).send(response);

    } catch (error) {
      next(createHttpError.InternalServerError(error));
    }
  }

  async updatePhoto(req, res, next) {

    try {

      await CustomerRepository.updatePhoto(req.data.administrator.customer, req.file.filename);
      
      const administrator = await AdministratorRepository.get(req.data.administrator.customer.id);

      administrator.hidePassword();

      const response = ResponseDTO.success(req.__('_updated._photo'), administrator);

      res.status(StatusCodes.OK).send(response);

    } catch (error) {
      next(createHttpError.InternalServerError(error));
    }
  }

  async updatePassword(req, res, next) {
    
    try {

      const hashedPassword = await Hash.hashPassword(req.body.new_password);
      
      await AdministratorRepository.updatePassword(req.data.administrator.id, hashedPassword);

      const response = ResponseDTO.success(req.__('_updated._password'));

      res.status(StatusCodes.OK).send(response);

    } catch (error) {
      next(createHttpError.InternalServerError(error));
    }
  }

  get(req, res) {

    const { administrator } = req.data;

    administrator.hidePassword();

    const response = ResponseDTO.success(req.__('_fetched._administrator'), administrator);

    res.status(StatusCodes.OK).send(response);
  }


  async getStatistics(req, res, next) {

    try {

      const statistics = {};

      statistics.number_of_customers = await CustomerRepository.getCount();

      statistics.number_of_stores = await StoreRepository.getCount();

      statistics.number_of_delivery_firms = await DeliveryFirmRepository.getCount();

      statistics.number_of_categories = await CategoryRepository.getCount();

      statistics.number_of_products = await ProductRepository.getCount();

      statistics.number_of_orders = await OrderRepository.getCount();

      statistics.total_earnings = await TransactionRepository.getBalance(req.auth.userId);

      const response = ResponseDTO.success(req.__('_fetched._statistics'), statistics);

      res.status(StatusCodes.OK).send(response);

    } catch(error) {
      next(createHttpError.InternalServerError(error));
    }
  }

}

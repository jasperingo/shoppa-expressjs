
const express = require('express');
const { checkSchema } = require('express-validator');
const CustomerController = require('../controllers/CustomerController');
const FavoriteController = require('../controllers/FavoriteController');
const AddressController = require('../controllers/AddressController');
const Files = require('../utils/Files');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const CustomerPermissionMiddleware = require('../middlewares/permissions/customer/CustomerPermissionMiddleware');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const FileUploadMiddleware = require('../middlewares/FileUploadMiddleware');
const CustomerLoginValidation = require('../validation/customer/CustomerLoginValidation');
const CustomerRegistrationValidation = require('../validation/customer/CustomerRegistrationValidation');
const CustomerUpdateStatusValidation = require('../validation/customer/CustomerUpdateStatusValidation');
const CustomerUpdatePasswordValidation = require('../validation/customer/CustomerUpdatePasswordValidation');
const CustomerUpdateValidation = require('../validation/customer/CustomerUpdateValidation');
const FileUploadValidationMiddleware = require('../middlewares/FileUploadValidationMiddleware');
const CustomerFetchMiddleware = require('../middlewares/fetch/CustomerFetchMiddleware');
const PaginationMiddleware = require('../middlewares/PaginationMiddleware');
const AdministratorPermissionMiddleware = require('../middlewares/permissions/AdministratorPermissionMiddleware');
const SavedCartController = require('../controllers/SavedCartController');
const WithdrawalAccountController = require('../controllers/WithdrawalAccountController');
const CustomerAndAdminPermissionMiddleware = require('../middlewares/permissions/customer/CustomerAndAdminPermissionMiddleware');
const WithdrawalAccountUpdateValidation = require('../validation/withdrawal_account/WithdrawalAccountUpdateValidation');
const CustomerLoginPermissionMiddleware = require('../middlewares/permissions/customer/CustomerLoginPermissionMiddleware');
const OrderController = require('../controllers/OrderController');
const TransactionController = require('../controllers/TransactionController');
const OrderListFilterMiddleware = require('../middlewares/OrderListFilterMiddleware');
const CustomerFetchPermissionMiddleware = require('../middlewares/permissions/customer/CustomerFetchPermissionMiddleware');
const AuthValidationMiddleware = require('../middlewares/AuthValidationMiddleware');

const router = express.Router();

const controller = new CustomerController();

const addressController = new AddressController();

const withdrawalAccountController = new WithdrawalAccountController();

const favoriteController = new FavoriteController();

const savedCartController = new SavedCartController();

const orderController = new OrderController();

const transactionController = new TransactionController();

router.post(
  '/register', 
  checkSchema(CustomerRegistrationValidation), 
  ValidationMiddleware, 
  controller.register
);

router.post(
  '/login', 
  checkSchema(CustomerLoginValidation), 
  AuthValidationMiddleware, 
  CustomerLoginPermissionMiddleware,
  controller.login
);

router.put(
  '/:id(\\d+)/update', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerPermissionMiddleware, 
  checkSchema(CustomerUpdateValidation), 
  ValidationMiddleware, 
  controller.update
);

router.put(
  '/:id(\\d+)/photo/update',
  CustomerFetchMiddleware, 
  AuthMiddleware,
  CustomerPermissionMiddleware, 
  FileUploadMiddleware(Files.USER_PHOTO_PATHS.customer).single('photo'), 
  FileUploadValidationMiddleware('photo'), 
  controller.updatePhoto
);

router.put(
  '/:id(\\d+)/password/update', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerPermissionMiddleware, 
  checkSchema(CustomerUpdatePasswordValidation), 
  ValidationMiddleware, 
  controller.updatePassword
);

router.put(
  '/:id(\\d+)/status/update', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  AdministratorPermissionMiddleware, 
  checkSchema(CustomerUpdateStatusValidation),
  ValidationMiddleware, 
  controller.updateStatus
);

router.put(
  '/:id(\\d+)/withdrawal-account/update', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerPermissionMiddleware, 
  checkSchema(WithdrawalAccountUpdateValidation),
  ValidationMiddleware, 
  withdrawalAccountController.updateCustomerWithdrawalAccount
);

router.get(
  '/list', 
  AuthMiddleware, 
  AdministratorPermissionMiddleware,
  PaginationMiddleware,
  controller.getList
);

router.get(
  '/:id(\\d+)/address/list', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerAndAdminPermissionMiddleware,
  addressController.getListByCustomer
);

router.get(
  '/:id(\\d+)/favorite/list', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerAndAdminPermissionMiddleware,
  PaginationMiddleware,
  favoriteController.getListByCustomer
);

router.get(
  '/:id(\\d+)/saved-cart/list', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerAndAdminPermissionMiddleware,
  PaginationMiddleware,
  savedCartController.getListByCustomer
);

router.get(
  '/:id(\\d+)/order/list', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerAndAdminPermissionMiddleware,
  PaginationMiddleware,
  OrderListFilterMiddleware,
  orderController.getListByCustomer
);

router.get(
  '/:id(\\d+)/transaction/list', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerAndAdminPermissionMiddleware,
  PaginationMiddleware,
  transactionController.getListByCustomer
);

router.get(
  '/:id(\\d+)', 
  CustomerFetchMiddleware,
  AuthMiddleware, 
  CustomerFetchPermissionMiddleware,
  controller.get
);

module.exports = router;

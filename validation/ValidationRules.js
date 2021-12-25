
const InternalServerException = require("../http/exceptions/InternalServerException");
const Address = require("../models/Address");
const Category = require("../models/Category");
const CustomerRepository = require("../repository/CustomerRepository");

module.exports = {

  errorFormat: err=> ({
    name: err.param,
    value: err.value,
    message: err.msg,
    errors: err.nestedErrors
  }),
  
  validationHasServerError(errors) {
    const emailError = errors.mapped().email;
    const passwordError = errors.mapped().password;
    return ((emailError && emailError.message === InternalServerException.TAG) || 
      (passwordError && passwordError.message === InternalServerException.TAG))
  },

  isPasswordLength: {
    options: { 
      max : 20,
      min: 6
    },
    bail: true,
    errorMessage: (value, { req })=> req.__('_error._form._password_length', { min: 6, max: 20 })
  },

  isPhoneNumberLength: {
    options: { 
      max : 11,
      min: 11
    },
    bail: true,
    errorMessage: (value, { req })=> req.__('_error._form._phone_number_invalid')
  },

  notEmpty: {
    bail: true,
    errorMessage: (value, { req })=> req.__('_error._form._field_required')
  },

  isInt: {
    bail: true,
    errorMessage: (value, { req })=> req.__('_error._form._field_invalid')
  },

  isEmail: {
    bail: true,
    errorMessage: (value, { req })=> req.__('_error._form._email_invalid')
  },

  addressTypeIsIn: {
    options: [[Address.TYPE_DEFAULT, Address.TYPE_SUB, Address.TYPE_PICK_UP]],
    errorMessage: (value, { req })=> req.__('_error._form._field_invalid')
  },

  categoryTypeIsIn: {
    options: [[Category.TYPE_STORE, Category.TYPE_PRODUCT]],
    errorMessage: (value, { req })=> req.__('_error._form._field_invalid')
  },

  getAuthPasswordValid(user) {
    return {
      isLength: this.isPasswordLength, 
      custom: {
        options: async (value, { req })=> {
          try {
            if (! (await comparePassword(value, req.data[user].password)) )
              return Promise.reject(req.__('_error._form._password_invalid'));
          } catch (err) {
            return Promise.reject(InternalServerException.TAG);
          }
        }
      }
    };
  },
  
  getCustomerEmailValid() {
    return {
      notEmpty: this.notEmpty,
      isEmail: this.isEmail,
      custom: {
        options: async (value, { req })=> {
          try {
            const customer = await CustomerRepository.getByEmail(value)
            if (customer === null)
              return Promise.reject(req.__('_error._form._email_invalid'));
            else 
              req.data = { customer };
          } catch (err) {
            return Promise.reject(InternalServerException.TAG);
          }
        }
      }
    }
  },

  getPasswordConfirmation(pwd = 'password') {
    return {
      isLength: this.isPasswordLength,
      custom: {
        options: (value, { req })=> value === req.body[pwd],
        errorMessage: (value, { req })=> req.__('_error._form._password_confirmation_not_match')
      }
    }
  }

};


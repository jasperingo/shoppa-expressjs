const Administrator = require("../models/Administrator");
const Customer = require("../models/Customer");
const Store = require("../models/Store");
const User = require("../models/User");

module.exports = {

  get(id) {
    return Administrator.findOne({   
      where: { id },
      include: {
        model: Customer,
        include: {
          model: User
        } 
      } 
    });
  },

  getByEmail(email) {
    return Administrator.findOne({   
      include: {
        model: Customer,
        include: {
          model: User,
          where: { email }
        } 
      } 
    });
  },

  getByEmailAndStoreName(email, name) {
    return Administrator.findOne({ 
      attributes:['id', 'password', 'role', 'type'], 
      where: { 
        type: Administrator.TYPE_STORE,
        '$customer.user.email$': email,
        '$customer.user.type$': User.TYPE_CUSTOMER,
        '$store.user.name$': name,
        '$store.user.type$': User.TYPE_STORE
      },
      include: [
        {
          model: Store,
          attributes: ['id'],
          include: {
            model: User,
            attributes: ['id']
          }
        },
        {
          model: Customer,
          attributes: ['id'],
          include: {
            model: User,
            attributes: ['id']
          } 
        } 
      ]
    });
  },

  updatePassword(id, password) {
    return Administrator.update({ password }, { where: { id } });
  },

};


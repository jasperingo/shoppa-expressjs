const { Op } = require("sequelize");
const Address = require("../models/Address");
const User = require("../models/User");
const WithdrawalAccount = require("../models/WithdrawalAccount");
const WorkingHour = require("../models/WorkingHour");

module.exports = {

  async nameExists(name) {
    const res = await User.findOne({ attributes: ['id'], where: { name } });
    return res !== null;
  },

  async updateNameExists(name, id) {
    const res = await User.findOne({ 
      attributes: ['id'], 
      where: {
        name, 
        [Op.not]: { id }
      } 
    });
    return res !== null;
  }, 

  async emailExists(email) {
    const res = await User.findOne({ attributes: ['id'], where: { email } });
    return res !== null;
  },

  async updateEmailExists(email, id) {
    const res = await User.findOne({ 
      attributes: ['id'], 
      where: { 
        email,
        [Op.not]: { id }
      } 
    });
    return res !== null;
  },

  async phoneNumberExists(phone_number) {
    const res = await User.findOne({ attributes: ['id'], where: { phone_number } });
    return res !== null;
  },

  async updatePhoneNumberExists(phone_number, id) {
    const res = await User.findOne({ 
      attributes: ['id'], 
      where: {
        phone_number,
        [Op.not]: { id }
      } 
    });
    return res !== null;
  },

  async emailVerificationTokenExists(email_verification_token) {
    const res = await User.findOne({ attributes: ['id'], where: { email_verification_token } });
    return res !== null;
  },

  async statusIsActive(id) {
    const res = await User.findOne({ 
      attributes: ['id'], 
      where: { id, status: User.STATUS_ACTIVE } 
    });
    return res !== null;
  },

  getByEmail(email) {
    return User.findOne({ where: { email } });
  },

  getByEmailVerificationToken(email_verification_token) {
    return User.findOne({ 
      where: { email_verification_token },
      include: [
        {
          model: Address,
          attributes: Address.GET_ATTR
        },
        {
          model: WorkingHour,
          attributes: WorkingHour.GET_ATTR
        },
        {
          model: WithdrawalAccount,
          attributes: WithdrawalAccount.GET_ATTR
        }
      ]
    });
  },

  updateEmailVerified(user, email_verified) {
    return User.update(
      { 
        email_verified, 
        status: user.type === User.TYPE_CUSTOMER 
          ? User.STATUS_ACTIVE 
          : user.working_hours.length > 0 && user.addresses.length > 0 
            ? User.STATUS_ACTIVE
            : User.STATUS_ACTIVATING,
      }, 
      { where: { id: user.id } }
    );
  }
  
}

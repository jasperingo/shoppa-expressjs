const { Op } = require("sequelize");
const Category = require("../models/Category");
const DiscountProduct = require("../models/DiscountProduct");
const Favorite = require("../models/Favorite");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Review = require("../models/Review");
const SavedCartItem = require("../models/SavedCartItem");
const Store = require("../models/Store");
const SubCategory = require("../models/SubCategory");
const User = require("../models/User");
const sequelize = require("./DB");

module.exports = {

  async idExists(id) {
    const product = await Product.findOne({ 
      attributes: ['id'], 
      where: { id } 
    });
    return product !== null;
  },

  async idExistsForStore(id, store_id) {
    const product = await Product.findOne({ 
      attributes: ['id'], 
      where: { id, store_id } 
    });
    return product !== null;
  },

  async titleExists(title) {
    const product = await Product.findOne({ 
      attributes: ['id'], 
      where: { title } 
    });
    return product !== null;
  },

  async updateTitleExists(title, id) {
    const product = await Product.findOne({ 
      attributes: ['id'], 
      where: { 
        title, 
        [Op.not]: { id },
      } 
    });
    return product !== null;
  },

  get(id) {
    return Product.findOne({
      where: { id },
      include: [
        {
          model: Store,
          attributes: ['id'],
          include: [
            {
              model: User,
              attributes: User.GET_ATTR
            },
            {
              model: SubCategory,
              attributes: SubCategory.GET_ATTR,
              include: {
                model: Category,
                attributes: Category.GET_ATTR,
              }
            },
          ]
        },
        {
          model: ProductVariant,
        },
        {
          model: SubCategory,
          attributes: SubCategory.GET_ATTR,
          include: {
            model: Category,
            attributes: Category.GET_ATTR,
          }
        },
      ]
    });
  },

  getCount() {
    return Product.count();
  },
  
  getListByStore(store, offset, limit, options) {
    return sequelize.transaction(async (transaction)=> {

      const { count, rows } = await Product.findAndCountAll({
        where: { store_id: store.id, ...options },
        include: [
          {
            model: Store,
            include: [
              {
                model: User,
                attributes: User.GET_ATTR
              },
              {
                model: SubCategory,
                attributes: SubCategory.GET_ATTR,
                include: {
                  model: Category,
                  attributes: Category.GET_ATTR,
                }
              },
            ]
          },
          {
            model: SubCategory,
            attributes: SubCategory.GET_ATTR,
            include: {
              model: Category,
              attributes: Category.GET_ATTR,
            }
          },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction
      });
      
      await this.getProductsLeastPriceVariant(rows, transaction);
      
      return { count, rows };
    });
  },
  
  getListByStoreWithDiscount(store, discount_id, offset, limit) {
    return sequelize.transaction(async (transaction)=> {

      const { count, rows } = await Product.findAndCountAll({
        where: { store_id: store.id },
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction
      });

      for (let product of rows) {
        let discountProduct = await DiscountProduct.findOne({
          where: {
            discount_id,
            product_id: product.id
          },
          transaction
        });

        product.setDataValue('discount_products', (discountProduct === null ? [] : [discountProduct]));
      }

      return { count, rows };
    });
  },

  getRandomList(limit, options) {
    return sequelize.transaction(async (transaction)=> {

      const rows = await Product.findAll({
        where: { '$store.user.status$': User.STATUS_ACTIVE, ...options },
        include: [
          {
            model: Store,
            include: [
              {
                model: User,
                attributes: User.GET_ATTR
              },
              {
                model: SubCategory,
                attributes: SubCategory.GET_ATTR,
                include: {
                  model: Category,
                  attributes: Category.GET_ATTR,
                }
              },
            ]
          },
          {
            model: SubCategory,
            attributes: SubCategory.GET_ATTR,
            include: {
              model: Category,
              attributes: Category.GET_ATTR,
            }
          },
        ],
        order: sequelize.random(),
        limit,
        transaction
      });
      
      await this.getProductsLeastPriceVariant(rows, transaction);
      
      return rows;
    });
  },

  getListByRecommended(limit, options) {
    return sequelize.transaction(async (transaction)=> {

      const rows = await Product.findAll({
        where: { 
          recommended: true,
          '$store.user.status$': User.STATUS_ACTIVE,
          ...options
        },
        include: [
          {
            model: Store,
            include: [
              {
                model: User,
                attributes: User.GET_ATTR
              },
              {
                model: SubCategory,
                attributes: SubCategory.GET_ATTR,
                include: {
                  model: Category,
                  attributes: Category.GET_ATTR,
                }
              },
            ]
          },
          {
            model: SubCategory,
            attributes: SubCategory.GET_ATTR,
            include: {
              model: Category,
              attributes: Category.GET_ATTR,
            }
          },
        ],
        order: sequelize.random(),
        limit,
        transaction
      });
      
      await this.getProductsLeastPriceVariant(rows, transaction);
      
      return rows;
    });
  },

  getListBySearch(offset, limit, { q, sub_category_id, ...options }) {
    
    const where = { '$store.user.status$': User.STATUS_ACTIVE, ...options };

    if (q) {
      where.title = { [Op.like]: `%${q}%` };
    }

    if (sub_category_id) {
      where.sub_category_id = sub_category_id;
    }

    return sequelize.transaction(async (transaction)=> {

      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Store,
            include: [
              {
                model: User,
                attributes: User.GET_ATTR
              },
              {
                model: SubCategory,
                attributes: SubCategory.GET_ATTR,
                include: {
                  model: Category,
                  attributes: Category.GET_ATTR,
                }
              },
            ]
          },
          {
            model: SubCategory,
            attributes: SubCategory.GET_ATTR,
            include: {
              model: Category,
              attributes: Category.GET_ATTR,
            }
          },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction
      });
      
      await this.getProductsLeastPriceVariant(rows, transaction);
      
      return { count, rows };
    });
  },

  getRelatedList(product, offset, limit, options) {
    return sequelize.transaction(async (transaction)=> {

      const { count, rows } = await Product.findAndCountAll({
        where: { 
          id: { [Op.not]: product.id },
          store_id: product.store.id,
          '$store.user.status$': User.STATUS_ACTIVE,
          '$sub_category.category.id$': product.sub_category.category.id,
          ...options
        },
        include: [
          {
            model: Store,
            include: [
              {
                model: User,
                attributes: User.GET_ATTR
              },
              {
                model: SubCategory,
                attributes: SubCategory.GET_ATTR,
                include: {
                  model: Category,
                  attributes: Category.GET_ATTR,
                }
              },
            ]
          },
          {
            model: SubCategory,
            attributes: SubCategory.GET_ATTR,
            include: {
              model: Category,
              attributes: Category.GET_ATTR,
            }
          },
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit,
        transaction
      });
      
      await this.getProductsLeastPriceVariant(rows, transaction);
      
      return { count, rows };
    });
  },

  async getProductsLeastPriceVariant(products, transaction) {
    for (let product of products) {
      let variant = await ProductVariant.findOne({
        attributes: ['id', 'price'],
        where: { product_id: product.id },
        order: [['price', 'ASC']],
        transaction
      });

      product.setDataValue('product_variants', (variant === null ? [] : [variant]));
    }
  },
  
  create({ sub_category_id, title, description }, store_id) {
    return Product.create({ store_id, sub_category_id, title, description });
  },
  
  update(product, { sub_category_id, title, description }) {
    return Product.update(
      { sub_category_id, title, description },
      { where: { id: product.id } }
    );
  },

  updatePhoto(product, photo) {
    return Product.update({ photo }, { where : { id: product.id } });
  },

  updateRecommended(product, recommended) {
    return Product.update({ recommended }, { where : { id: product.id } });
  },

  delete(product) {
    return sequelize.transaction(async (transaction)=> {
      return await Promise.all([
        Product.destroy({ where: { id: product.id }, transaction }),
        ProductVariant.destroy({ where: { product_id: product.id }, transaction }),
        DiscountProduct.destroy({ where: { product_id: product.id }, transaction }),
        Favorite.destroy({ where: { product_id: product.id }, transaction }),
        Review.destroy({ where: { product_id: product.id }, transaction }),
        SavedCartItem.destroy({ 
          where: { 
            product_variant_id: {
              [Op.in]: product.product_variants.map(i=> i.id)
            } 
          }, 
          transaction
         }),
      ]);
    });
  }

};


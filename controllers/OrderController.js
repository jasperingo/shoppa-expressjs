const { StatusCodes } = require("http-status-codes");
const InternalServerException = require("../http/exceptions/InternalServerException");
const Response = require("../http/Response");
const StringGenerator = require("../http/StringGenerator");
const Discount = require("../models/Discount");
const Order = require("../models/Order");
const AddressRepository = require("../repository/AddressRepository");
const DiscountProductRepository = require("../repository/DiscountProductRepository");
const OrderRepository = require("../repository/OrderRepository");
const ProductVariantRepository = require("../repository/ProductVariantRepository");
const RouteDurationRepository = require("../repository/RouteDurationRepository");
const RouteRepository = require("../repository/RouteRepository");
const RouteWeightRepository = require("../repository/RouteWeightRepository");
const StoreRepository = require("../repository/StoreRepository");


module.exports = class OrderController {

  async create(req, res, next) {
    
    try {

      const data = req.body;
      
      const products = [];

      data.sub_total = 0;

      data.delivery_total = 0;

      data.discount_total = 0;

      data.number = await StringGenerator.orderNumber();

      data.transaction_reference = await StringGenerator.transactionReference();

      for (let [i, item] of data.order_items.entries()) {

        let productVariant = await ProductVariantRepository.get(item.product_variant_id);

        data.order_items[i].index = i;

        data.order_items[i].product_id = productVariant.product_id;

        data.order_items[i].weight = productVariant.weight * item.quantity;

        data.order_items[i].amount = productVariant.price * item.quantity;

        data.sub_total += productVariant.price * item.quantity; 

        if (item.route_weight_id !== undefined && item.route_weight_id !== null) {
          let routeWeight = await RouteWeightRepository.get(item.route_weight_id);
          data.order_items[i].delivery_weight_fee = routeWeight.price;
          data.delivery_total += routeWeight.price;
        }

        if (item.route_duration_id !== undefined && item.route_duration_id !== null) {
          let routeDuration = await RouteDurationRepository.get(item.route_duration_id);
          data.order_items[i].delivery_duration_fee = routeDuration.fee;
          data.delivery_total += routeDuration.fee;
        }

      }

      for (let item of data.order_items) {

        let index = products.findIndex(product=> product.id === item.product_id);

        if (index === -1) {
          products.push({ id: item.product_id, product_variants: [item] })
        } else {
          products[index].product_variants.push(item);
        }
      }

      for (let product of products) {

        if (product.product_variants[0].discount_product_id === undefined || product.product_variants[0].discount_product_id === null) {
          continue;
        }

        let discountTotal = 0;

        let discountProduct = await DiscountProductRepository.getWithDiscount(product.product_variants[0].discount_product_id);

        let amountTotal = product.product_variants.reduce((prev, variant)=> prev + variant.amount, 0);

        if (discountProduct.discount.type === Discount.TYPE_AMOUNT) {
          discountTotal = discountProduct.discount.value;
        } else if (discountProduct.discount.type === Discount.TYPE_PERCENTAGE) {
          discountTotal = (discountProduct.discount.value / 100) * amountTotal;
        }

        data.discount_total += discountTotal;

        for (let variant of product.product_variants) {
          let percentage = (variant.amount * 100) / amountTotal;
          let discountAmount = (percentage / 100) * discountTotal;
          data.order_items[variant.index].discount_amount = Number(discountAmount.toFixed(2));
        }
      }
      
      const _order = await OrderRepository.create(data);

      const order = await OrderRepository.getWithTransactions(_order.id);

      const response = new Response(Response.SUCCESS, req.__('_created._order'), order);

      res.status(StatusCodes.CREATED).send(response);

    } catch (error) {
      next(new InternalServerException(error));
    }
  }

  async getRouteSuggestions(req, res, next) {
    
    try {

      const data = req.body;

      const { customerAddress, storeAddress } = req.data;
      
      const routes = await RouteRepository.getListByTwoCityAndState(
        customerAddress.state, 
        customerAddress.city, 
        storeAddress.state, 
        storeAddress.city
      );

      console.log(routes.length)

      for (let i=0; i<routes.length; i++) {

        let weights = [];

        for (let item of data.order_items) {

          let productVariant = await ProductVariantRepository.get(item.product_variant_id);
  
          let weight = productVariant.weight * item.quantity;

          const routeWeight = await RouteWeightRepository.getByRouteAndWeight(routes[i].id, weight);

          if (routeWeight === null) break;

          routeWeight.setDataValue('product_variant_id', item.product_variant_id);

          weights.push(routeWeight);
        }

        if (weights.length !== data.order_items.length) {
          routes.splice(i--, 1);
        } else {
          routes[i].setDataValue('route_weights', weights);
        }
      }

      for (let [i, route] of routes.entries()) {
        let routeDurations = await RouteDurationRepository.getListByRoute(route.id);
        routes[i].setDataValue('route_durations', routeDurations);
      }
     
      const response = new Response(Response.SUCCESS, req.__('_list_fetched._route'), routes);

      res.status(StatusCodes.OK).send(response);

    } catch(error) {
      next(new InternalServerException(error));
    }
  }

  async getDiscountSuggestions(req, res, next) {
    
    try {

      const data = req.body;

      const products = [];

      for (let item of data.order_items) {

        let productVariant = await ProductVariantRepository.get(item.product_variant_id);

        item.amount = productVariant.price * item.quantity;
  
        let index = products.findIndex(product=> product.id === productVariant.product_id);

        if (index === -1) {
          products.push({ id: productVariant.product_id, product_variants: [item] })
        } else {
          products[index].product_variants.push(item);
        }
      }
      
      for (let [i, product] of products.entries()) {

        let quantity = product.product_variants.reduce((prev, variant)=> prev + variant.quantity, 0);

        let amount = product.product_variants.reduce((prev, variant)=> prev + variant.amount, 0);

        product.product_variants =  product.product_variants.map(v=> {
          v.amount = undefined;
          return v;
        });

        let discountProducts = await DiscountProductRepository.getListByNotExpiredAndProductAndQuantityAndAmount(product.id, quantity, amount);

        products[i].discount_products = discountProducts;

      }
      
      const response = new Response(Response.SUCCESS, req.__('_list_fetched._discount'), products);

      res.status(StatusCodes.OK).send(response);

    } catch(error) {
      next(new InternalServerException(error));
    }
  }

  async updateStatus(req, res, next) {
    
    try {
      
      if (req.body.status === Order.STATUS_CANCELLED)
        await OrderRepository.updateStatusToCancel(req.data.order, StringGenerator.transactionReference);

      const order = await OrderRepository.get(req.data.order.id);

      const response = new Response(Response.SUCCESS, req.__('_updated._order_status'), order);

      res.status(StatusCodes.OK).send(response);

    } catch (error) {
      next(new InternalServerException(error));
    }
  }

  async storeStatusUpdate(req, res, next) {
    
    try {
      
      switch (req.body.store_status) {
        case Order.STORE_STATUS_ACCEPTED:
          await OrderRepository.updateStoreStatusToAccepted(req.data.order, StringGenerator.transactionReference);
          break;
        case Order.STORE_STATUS_DECLINED:
          await OrderRepository.updateStoreStatusToDeclined(req.data.order, StringGenerator.transactionReference);
          break;
      }
      
      const order = await OrderRepository.get(req.data.order.id);

      const response = new Response(Response.SUCCESS, req.__('_updated._order_store_status'), order);

      res.status(StatusCodes.OK).send(response);
      
    } catch (error) {
      next(new InternalServerException(error));
    }
  }

  async deliveryFirmStatusUpdate(req, res, next) {
    
    try {
      
      switch (req.body.delivery_firm_status) {
        case Order.DELIVERY_FIRM_STATUS_ACCEPTED:
          await OrderRepository.updateDeliveryFirmStatusToAccepted(req.data.order, StringGenerator.transactionReference);
          break;
        case Order.DELIVERY_FIRM_STATUS_DECLINED:
          await OrderRepository.updateDeliveryFirmStatusToDeclined(req.data.order, StringGenerator.transactionReference);
          break;
      }

      const order = await OrderRepository.get(req.data.order.id);

      const response = new Response(Response.SUCCESS, req.__('_updated._order_delivery_firm_status'), order);

      res.status(StatusCodes.OK).send(response);
      
    } catch (error) {
      next(new InternalServerException(error));
    }
  }

}


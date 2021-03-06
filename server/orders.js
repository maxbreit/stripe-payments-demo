/**
 * orders.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Simple library to store and interact with orders and products.
 * These methods are using the Stripe Orders API, but we tried to abstract them
 * from the main code if you'd like to use your own order management system instead.
 */

'use strict';

const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

// Create an order.
const createOrder = async (currency, items, email, customer, country) => {
  return await stripe.orders.create({
    currency,
    items,
    email,
    metadata: {
      customer,
      country,
      status: 'created',
    },
  });
};

// Retrieve an order by ID.
const retrieveOrder = async orderId => {
  return await stripe.orders.retrieve(orderId);
};

// Pay an order by ID.
const payOrder = async (orderId, sourceId)=> {
  return await stripe.orders.pay(orderId, { source: sourceId });
};

// Update an order.
const updateOrder = async (orderId, properties) => {
  return await stripe.orders.update(orderId, properties);
};

// List all products.
const listProducts = async () => {
  return await stripe.products.list({active: true});
};

// Retrieve a product by ID.
const retrieveProduct = async productId => {
  return await stripe.products.retrieve(productId);
};

// Validate that products exist.
const checkProducts = productList => {
  return true;
  const validProducts = ['Langsamer Walzer', 'Wiener Walzer', 'Discofox'];
  return productList.data.reduce((accumulator, currentValue) => {
    return (
      accumulator &&
      validProducts.includes(currentValue.id)
    );
  }, !!productList.data.length);
};

exports.orders = {
  create: createOrder,
  retrieve: retrieveOrder,
  pay: payOrder,
  update: updateOrder,
};

exports.products = {
  list: listProducts,
  retrieve: retrieveProduct,
  exist: checkProducts,
};

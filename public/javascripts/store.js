"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
 * store.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Representation of products, line items, and orders, and saving them on Stripe.
 * Please note this is overly simplified class for demo purposes (all products
 * are loaded for convenience, there is no cart management functionality, etc.).
 * A production app would need to handle this very differently.
 */

var Store = (function () {
    function Store() {
        _classCallCheck(this, Store);

        this.lineItems = [];
        this.products = {};
        this.urlPrefix = 'https://doodance-stripe.herokuapp.com';
    }

    // Add the item with the specified name to the list of line items

    _createClass(Store, [
        {
            key: "addItemToList",
            value: function addItemToList(name) {
                if (!this.products) return;
                if (!this.products[name]) throw name + " is not a known product!";
                var product = this.products[name];
                var sku = product.skus.data[0];
                this.lineItems.push({
                    product: product.name,
                    sku: sku.id,
                    quantity: 1
                });
            }

            // Remove the item with the specified name from the list of line items
        },
        {
            key: "removeItemFromList",
            value: function removeItemFromList(name) {
                if (!this.products[name]) throw name + " is not a known product!";
                var product = this.products[name];
                this.lineItems = this.lineItems.filter(function (i) {
                    return i.product !== product.name;
                });
            }
        },
        {
            key: "flushItemList",
            value: function flushItemList() {
                this.lineItems = [];
            }

            // Compute the total for the order based on the line items (SKUs and quantity).
        },
        {
            key: "getOrderTotal",
            value: function getOrderTotal() {
                var _this = this;

                return Object.values(this.lineItems).reduce(function (total, _ref) {
                    var product = _ref.product,
                        sku = _ref.sku,
                        quantity = _ref.quantity;
                    return total + quantity * _this.products[product].skus.data[0].price;
                }, 0);
            }

            // Expose the line items for the order (in a way that is friendly to the Stripe Orders API).
        },
        {
            key: "getOrderItems",
            value: function getOrderItems() {
                var items = [];
                this.lineItems.forEach(function (item) {
                    return items.push({
                        type: "sku",
                        parent: item.sku,
                        quantity: item.quantity
                    });
                });
                return items;
            }

            // Retrieve the configuration from the API.
        },
        {
            key: "getConfig",
            value: async function getConfig() {
                try {
                    var response = await fetch(this.urlPrefix + "/config", {
                        mode: "cors"
                    });
                    return await response.json();
                } catch (err) {
                    return {error: err.message};
                }
            }

            // Load the product details.
        },
        {
            key: "loadProducts",
            value: async function loadProducts() {
                var _this2 = this;

                var productsResponse = await fetch(this.urlPrefix + "/products", {
                    mode: "cors"
                }); // {mode: 'cors'}
                var products = (await productsResponse.json()).data;
                products.forEach(function (product) {
                    return (_this2.products[product.name] = product);
                });
            }

            // Create an order object to represent the line items.
        },
        {
            key: "createOrder",
            value: async function createOrder(currency, items, email, shipping) {
                try {
                    var response = await fetch(this.urlPrefix + "/orders", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            currency: currency,
                            items: items,
                            email: email
                        })
                    });
                    var data = await response.json();
                    if (data.error) {
                        return {error: data.error};
                    } else {
                        // Save the current order locally to lookup its status later.
                        this.setActiveOrderId(data.order.id);
                        return data.order;
                    }
                } catch (err) {
                    return {error: err.message};
                }
                return order;
            }

            // Pay the specified order by sending a payment source alongside it.
        },
        {
            key: "payOrder",
            value: async function payOrder(order, source) {
                try {
                    var response = await fetch(
                        this.urlPrefix + "/orders/" + order.id + "/pay",
                        {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({source: source})
                        }
                    );
                    var data = await response.json();
                    if (data.error) {
                        return {error: data.error};
                    } else {
                        return data;
                    }
                } catch (err) {
                    return {error: err.message};
                }
            }

            // Fetch an order status from the API.
        },
        {
            key: "getOrderStatus",
            value: async function getOrderStatus(orderId) {
                try {
                    var response = await fetch(this.urlPrefix + "/orders/" + orderId);
                    return await response.json();
                } catch (err) {
                    return {error: err};
                }
            }

            // Format a price (assuming a two-decimal currency like EUR or USD for simplicity).
        },
        {
            key: "formatPrice",
            value: function formatPrice(amount, currency) {
                var price = (amount / 100).toFixed(2);
                var numberFormat = new Intl.NumberFormat(["en-US"], {
                    style: "currency",
                    currency: currency,
                    currencyDisplay: "symbol"
                });
                return numberFormat.format(price);
            }

            // Set the active order ID in the local storage.
        },
        {
            key: "setActiveOrderId",
            value: function setActiveOrderId(orderId) {
                localStorage.setItem("orderId", orderId);
            }

            // Get the active order ID from the local storage.
        },
        {
            key: "getActiveOrderId",
            value: function getActiveOrderId() {
                return localStorage.getItem("orderId");
            }
        }
    ]);

    return Store;
})();

window.store = new Store();

/**
 * store.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Representation of products, line items, and orders, and saving them on Stripe.
 * Please note this is overly simplified class for demo purposes (all products
 * are loaded for convenience, there is no cart management functionality, etc.).
 * A production app would need to handle this very differently.
 */

class Store {
    constructor() {
        this.lineItems = [];
        this.products = {};
        this.urlPrefix = 'https://doodance-stripe.herokuapp.com';
    }

    // Add the item with the specified name to the list of line items
    addItemToList(name) {
        if (!this.products) return;
        if (!this.products[name]) throw `${name} is not a known product!`;
        let product = this.products[name];
        let sku = product.skus.data[0];
        this.lineItems.push({
            product: product.name,
            sku: sku.id,
            quantity: 1,
        });
    }

    // Remove the item with the specified name from the list of line items
    removeItemFromList(name) {
        if (!this.products[name]) throw `${name} is not a known product!`;
        let product = this.products[name];
        this.lineItems = this.lineItems.filter(i => i.product !== product.name);
    }

    flushItemList() {
        this.lineItems = [];
    }

    // Compute the total for the order based on the line items (SKUs and quantity).
    getOrderTotal() {
        return Object.values(this.lineItems).reduce(
            (total, {product, sku, quantity}) =>
                total + quantity * this.products[product].skus.data[0].price,
            0
        );
    }

    // Expose the line items for the order (in a way that is friendly to the Stripe Orders API).
    getOrderItems() {
        let items = [];
        this.lineItems.forEach(item =>
            items.push({
                type: 'sku',
                parent: item.sku,
                quantity: item.quantity,
            })
        );
        return items;
    }

    // Retrieve the configuration from the API.
    async getConfig() {
        try {
            const response = await fetch(`${this.urlPrefix}/config`, {mode: 'cors'});
            console.log(response);
            return await response.json();
        } catch (err) {
            return {error: err.message};
        }
    }

    // Load the product details.
    async loadProducts() {
        const productsResponse = await fetch(`${this.urlPrefix}/products`, {mode: 'cors'}); // {mode: 'cors'}
        const products = (await productsResponse.json()).data;
        products.forEach(product => this.products[product.name] = product);
    }

    // Create an order object to represent the line items.
    async createOrder(currency, items, email, shipping) {
        try {
            const response = await fetch(`${this.urlPrefix}/orders`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    currency,
                    items,
                    email,
                }),
            });
            const data = await response.json();
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
    async payOrder(order, source) {
        try {
            const response = await fetch(`${this.urlPrefix}/orders/${order.id}/pay`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({source}),
            });
            const data = await response.json();
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
    async getOrderStatus(orderId) {
        try {
            const response = await fetch(`${this.urlPrefix}/orders/${orderId}`);
            return await response.json();
        } catch (err) {
            return {error: err};
        }
    }

    // Format a price (assuming a two-decimal currency like EUR or USD for simplicity).
    formatPrice(amount, currency) {
        let price = (amount / 100).toFixed(2);
        let numberFormat = new Intl.NumberFormat(['en-US'], {
            style: 'currency',
            currency: currency,
            currencyDisplay: 'symbol',
        });
        return numberFormat.format(price);
    }

    // Set the active order ID in the local storage.
    setActiveOrderId(orderId) {
        localStorage.setItem('orderId', orderId);
    }

    // Get the active order ID from the local storage.
    getActiveOrderId() {
        return localStorage.getItem('orderId');
    }
}

window.store = new Store();

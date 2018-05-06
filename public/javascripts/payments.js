/**
 * payments.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * This modern JavaScript file handles the checkout process using Stripe.
 *
 * 1. It shows how to accept card payments with the `card` Element, and
 * the `paymentRequestButton` Element for Payment Request and Apple Pay.
 * 2. It shows how to use the Stripe Sources API to accept non-card payments,
 * such as iDEAL, SOFORT, SEPA Direct Debit, and more.
 */

(async () => {
  'use strict';

  // Retrieve the configuration for the store.
  // const config = await store.getConfig();
  // const config = require('../config');

  let amount = 0;
  let courseName = '';

  // Create references to the main form and its submit button.
  const form = document.getElementById('payment-form');
  const submitButton = form.querySelector('button[type=submit]');

  /**
   * Setup Stripe Elements.
   */

  // Create a Stripe client.
  // const stripe = Stripe(config.stripePublishableKey);
  const stripe = Stripe('pk_test_CiXf29IdSdWEmeZGORUfnSFc');

  // Create an instance of Elements.
  const elements = stripe.elements();

  // Prepare the options for Elements to be styled accordingly.
  const elementsOptions = {
    style: {
      base: {
        iconColor: '#666ee8',
        color: '#31325f',
        fontWeight: 400,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '15px',
        '::placeholder': {
          color: '#aab7c4',
        },
        ':-webkit-autofill': {
          color: '#666ee8',
        },
      },
    },
  };

  /**
   * Implement a Stripe Card Element that matches the look-and-feel of the app.
   *
   * This makes it easy to collect debit and credit card payments information.
   */

  // Create a Card Element and pass some custom styles to it.
  const card = elements.create('card', elementsOptions);

  // Mount the Card Element on the page.
  card.mount('#card-element');

  // Monitor change events on the Card Element to display any errors.
  card.addEventListener('change', ({error}) => {
    const cardErrors = document.getElementById('card-errors');
    if (error) {
      cardErrors.textContent = error.message;
      cardErrors.classList.add('visible');
    } else {
      cardErrors.classList.remove('visible');
    }
    // Re-enable the Pay button.
    submitButton.disabled = false;
  });

  /**
   * Implement a Stripe Payment Request Button Element.
   *
   * This automatically supports the Payment Request API (already live on Chrome),
   * as well as Apple Pay on the Web on Safari.
   * When of these two options is available, this element adds a “Pay” button on top
   * of the page to let users pay in just a click (or a tap on mobile).
   */

    /**
     * Implement a PayPal Checkout button.
     *
     */
    paypal.Button.render({

        env: 'sandbox', // sandbox | production
        locale: 'en_DE',

        // PayPal Client IDs - replace with your own
        // Create a PayPal app: https://developer.paypal.com/developer/applications/create
        client: {
            // sandbox: 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R',
            sandbox: 'Afftm3m1c0dUx734SjzbUduO62yQzhxT2J1BptiJF9JfVGhqpMwt4q4rJY-6oLyE5LpB1Adm391Vzner',
            production: '<insert production client id>'
        },
        style: {
          label: 'paypal',
          size: 'responsive',    // small | medium | large | responsive
          shape: 'rect',     // pill | rect
          color: 'blue',     // gold | blue | silver | black
          tagline: false
        },

        // Show the buyer a 'Pay Now' button in the checkout flow
        commit: true,

        // payment() is called when the button is clicked
        payment: function (data, actions) {
            if (!amount) return;
            console.log('Payment with PayPal of', amount/100);
            // Make a call to the REST api to create the payment
            return actions.payment.create({
                payment: {
                    intent: 'sale',
                    transactions: [
                        {
                            amount: {
                              total: amount / 100,
                              currency: 'EUR',
                            },
                            description: courseName,
                            reference_id: courseName.toLocaleLowerCase().split(' ').join('-'),
                            item_list: {
                                items: [
                                    {
                                        name: courseName,
                                        sku: "1",
                                        price: (amount / 100).toString() + ".00",
                                        currency: "EUR",
                                        quantity: "1",
                                        description: courseName,
                                    },
                                ]
                            }
                        }
                    ]
                }
            });
        },

        // onAuthorize() is called when the buyer approves the payment
        onAuthorize: function (data, actions) {
            console.log('buyer approved the payment');
            // Make a call to the REST api to execute the payment
            return actions.payment.execute().then(function () {
                window.alert('Payment Complete!');
            });
        },
        // called if the buyer cancels the payment
        // By default, the buyer is returned to the original page,
        // but you're free to use this function to take them to a different page.
        onCancel: function (data, actions) {
            /*
             * Buyer cancelled the payment
             */
            console.log('Buyer cancelled the payment')
        },
        // called when an error occurs
        // You can allow the buyer to re-try or show an error message
        onError: function (err) {
            /*
             * An error occurred during the transaction
             */
            console.log('An error occurred during the transaction')
        },
        // called for every click on the PayPal button
        onClick: function () {
          console.log('PayPal button clicked');
        }

    }, '#paypal-button-container');

  // Make sure all data is loaded from the store to compute the order amount.
  await store.loadProducts();

  /**
   * Handle the form submission.
   *
   * This creates an order and either sends the card information from the Element
   * alongside it, or creates a Source and start a redirect to complete the purchase.
   *
   * Please note this form is not submitted when the user chooses the "Pay" button
   * or Apple Pay since they provide name and shipping information directly.
   */

  // Listen to changes to the user-selected country.
  form
    .querySelector('select[name=country]')
    .addEventListener('change', event => {
      event.preventDefault();
      const country = event.target.value;
      event.target.parentElement.className = `ddsco-field ${country}`;
      showRelevantPaymentMethods(country);
    });

  // Submit handler for our payment form.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    console.log('submitting form...')

    // Retrieve the user information from the form.
    const payment = form.querySelector('input[name=payment]:checked').value;
    const name = form.querySelector('input[name=name]').value;
    const country = form.querySelector('select[name=country] option:checked')
      .value;
    const email = form.querySelector('input[name=email]').value;
    // Disable the Pay button to prevent multiple click events.
    submitButton.disabled = true;

    // Create the order using the email and shipping information from the form.
    const order = await store.createOrder(
      'eur',
      store.getOrderItems(),
      email
    );

    console.log('created order', order);
    console.log('payment', payment);

    if (payment === 'card') {
      // Create a Stripe source from the card information and the owner name.
      const {source} = await stripe.createSource(card, {
        owner: {
          name,
        },
      });
      await handleOrder(order, source);
    } else {
      // Prepare all the Stripe source common data.
      const sourceData = {
        type: payment,
        amount: order.amount,
        currency: order.currency,
        owner: {
          name,
          email,
        },
        redirect: {
          return_url: window.location.href,
        },
        statement_descriptor: 'Stripe Payments Demo',
        metadata: {
          order: order.id,
        },
      };

      // Add extra source information which are specific to a payment method.
      switch (payment) {
        case 'sepa_debit':
          // SEPA Debit: Pass the IBAN entered by the user.
          sourceData.sepa_debit = {
            iban: form.querySelector('input[name=iban]').value,
          };
          break;
        case 'sofort':
          // SOFORT: The country is required before redirecting to the bank.
          sourceData.sofort = {
            country,
          };
          break;
      }

      // Create a Stripe source with the common data and extra information.
      const {source} = await stripe.createSource(sourceData);
      await handleOrder(order, source);
    }
  });

  // Handle the order and source activation if required
  const handleOrder = async (order, source) => {
  console.log('handling order', order, source);
  const mainElement = document.getElementById('ddsco-main');
    const confirmationElement = document.getElementById('confirmation');
    switch (order.metadata.status) {
      case 'created':
          console.log('order created...')
        switch (source.status) {
          case 'chargeable':
              console.log('case chargeable...')
            submitButton.textContent = 'Processing Payment…';
            const response = await store.payOrder(order, source);
            await handleOrder(response.order, response.source);
            break;
          case 'pending':
              console.log('case pending...')
            switch (source.flow) {
              case 'none':
                // Normally, sources with a `flow` value of `none` are chargeable right away,
                // but there are exceptions, for instance for WeChat QR codes just below.
                if (source.type === 'wechat') {
                  // Display the QR code.
                  const qrCode = new QRCode('wechat-qrcode', {
                    text: source.wechat.qr_code_url,
                    width: 128,
                    height: 128,
                    colorDark: '#424770',
                    colorLight: '#f8fbfd',
                    correctLevel: QRCode.CorrectLevel.H,
                  });
                  // Hide the previous text and update the call to action.
                  form.querySelector('.payment-info.wechat p').style.display =
                    'none';
                  let amount = store.formatPrice(
                    store.getOrderTotal(),
                    'eur'
                  );
                  submitButton.textContent = `Scan this QR code on WeChat to pay ${amount}`;
                  // Start polling the order status.
                  pollOrderStatus(order.id, 300000);
                } else {
                  console.log('Unhandled none flow.', source);
                }
                break;
              case 'redirect':
                // Immediately redirect the customer.
                submitButton.textContent = 'Redirecting…';
                window.location.replace(source.redirect.url);
                break;
              case 'code_verification':
                // Display a code verification input to verify the source.
                break;
              case 'receiver':
                // Display the receiver address to send the funds to.
                mainElement.classList.add('success', 'receiver');
                const receiverInfo = confirmationElement.querySelector(
                  '.receiver .info'
                );
                if (source.type === 'multibanco') {
                  // Display the Multibanco payment information to the user.
                  let amount = store.formatPrice(
                    source.amount,
                    'eur'
                  );
                  receiverInfo.innerHTML = `
                    <ul>
                      <li>
                        Amount (Montante):
                        <strong>${amount}</strong>
                      </li>
                      <li>
                        Entity (Entidade):
                        <strong>${source.multibanco.entity}</strong>
                      </li>
                      <li>
                        Reference (Referencia):
                        <strong>${source.multibanco.reference}</strong>
                      </li>
                    </ul>`;

                  // Poll the backend and check for an order status.
                  // The backend updates the status upon receiving webhooks,
                  // specifically the `source.chargeable` and `charge.succeeded` events.
                  pollOrderStatus(order.id);
                } else {
                  console.log('Unhandled receiver flow.', source);
                }
                break;
              default:
                // Order is received, pending payment confirmation.
                break;
            }
            break;
          case 'failed':
              console.log('case failed...');
              break;
          case 'canceled':
            // Authentication failed, offer to select another payment method.
            break;
          default:
            // Order is received, pending payment confirmation.
            break;
        }
        break;

      case 'pending':
          console.log('order pending...')
        // Success! Now waiting for payment confirmation. Update the interface to display the confirmation screen.
        mainElement.classList.remove('processing');
        // Update the note about receipt and shipping (the payment is not yet confirmed by the bank).
        confirmationElement.querySelector('.note').innerText =
          'We’ll send your receipt and ship your items as soon as your payment is confirmed.';
        mainElement.classList.add('success');
        break;

      case 'failed':
          console.log('order failed')
        // Payment for the order has failed.
        mainElement.classList.remove('success');
        mainElement.classList.remove('processing');
        mainElement.classList.remove('receiver');
        mainElement.classList.add('error');
        break;

      case 'paid':
          console.log('order paid!')
        // Success! Payment is confirmed. Update the interface to display the confirmation screen.
        mainElement.classList.remove('processing');
        mainElement.classList.remove('receiver');
        // Update the note about receipt and shipping (the payment has been fully confirmed by the bank).
        confirmationElement.querySelector('.note').innerText =
          'We just sent your receipt to your email address, and your items will be on their way shortly.';
        mainElement.classList.add('success');
        break;
    }
  };

  /**
   * Monitor the status of a source after a redirect flow.
   *
   * This means there is a `source` parameter in the URL, and an active order.
   * When this happens, we'll monitor the status of the order and present real-time
   * information to the user.
   */

  const pollOrderStatus = async (
    orderId,
    timeout = 30000,
    interval = 500,
    start = null
  ) => {
    start = start ? start : Date.now();
    const endStates = ['paid', 'failed'];
    // Retrieve the latest order status.
    const order = await store.getOrderStatus(orderId);
    await handleOrder(order, {status: null});
    if (
      !endStates.includes(order.metadata.status) &&
      Date.now() < start + timeout
    ) {
      // Not done yet. Let's wait and check again.
      setTimeout(pollOrderStatus, interval, orderId, timeout, interval, start);
    } else {
      if (!endStates.includes(order.metadata.status)) {
        // Status has not changed yet. Let's time out.
        console.warn(new Error('Polling timed out.'));
      }
    }
  };

  const orderId = store.getActiveOrderId();
  const mainElement = document.getElementById('ddsco-main');
  if (orderId && window.location.search.includes('source')) {
    // Update the interface to display the processing screen.
    mainElement.classList.add('success', 'processing');

    // Poll the backend and check for an order status.
    // The backend updates the status upon receiving webhooks,
    // specifically the `source.chargeable` and `charge.succeeded` events.
    pollOrderStatus(orderId);
  } else {
    // Update the interface to display the checkout form.
    mainElement.classList.add('checkout');
  }

  /**
   * Display the relevant payment methods for a selected country.
   */

  // List of relevant countries for the payment methods supported in this demo.
  // Read the Stripe guide: https://stripe.com/payments/payment-methods-guide
  const paymentMethods = {
    card: {
      name: 'Card',
      flow: 'none',
    },
    // giropay: {
    //   name: 'Giropay',
    //   flow: 'redirect',
    //   countries: [],
    // },
    sepa_debit: {
      name: 'SEPA Direct Debit',
      flow: 'none',
      countries: ['FR', 'DE', 'ES', 'BE', 'NL', 'LU', 'IT', 'PT', 'AT', 'IE'],
    },
    sofort: {
      name: 'SOFORT',
      flow: 'redirect',
      countries: ['DE', 'AT'],
    },
    paypal: {
      name: 'PayPal',
      flow: 'paypal'
    }
  };

  // Update the main button to reflect the payment method being selected.
    const updateButtonLabel = paymentMethod => {
        if (paymentMethod === 'paypal') {
            submitButton.style.display = 'none';
            document.getElementById('paypal-button-container')
                .style.display = 'initial';
        } else {
            let amount = store.formatPrice(store.getOrderTotal(), 'eur');
            let name = paymentMethods[paymentMethod].name;
            let label = `Pay ${amount}`;
            if (paymentMethod !== 'card') {
                label = `Pay ${amount} with ${name}`;
            }
            if (paymentMethod === 'wechat') {
                label = `Generate QR code to pay ${amount} with ${name}`;
            }
            submitButton.innerText = label;
            document.getElementById('paypal-button-container')
                .style.display = 'none';
            submitButton.style.display = 'initial';
        }
    };

  // Show only the payment methods that are relevant to the selected country.
  const showRelevantPaymentMethods = country => {
    if (!country) {
      country = form.querySelector('select[name=country] option:checked').value;
    }

    const paymentInputs = form.querySelectorAll('input[name=payment]');
    for (let i = 0; i < paymentInputs.length; i++) {
      let input = paymentInputs[i];
      input.parentElement.classList.toggle(
        'visible',
        input.value === 'paypal' || input.value === 'card' ||
          paymentMethods[input.value].countries.includes(country)
      );
    }

    // Hide the tabs if card is the only available option.
    const paymentMethodsTabs = document.getElementById('payment-methods');
    paymentMethodsTabs.classList.toggle(
      'visible',
      paymentMethodsTabs.querySelectorAll('li.visible').length > 1
    );

    // Check the first payment option again.
    paymentInputs[0].checked = 'checked';
    form.querySelector('.payment-info.paypal').classList.add('visible');
    form.querySelector('.payment-info.card').classList.remove('visible');
    form.querySelector('.payment-info.sepa_debit').classList.remove('visible');
    form.querySelector('.payment-info.wechat').classList.remove('visible');
    form.querySelector('.payment-info.redirect').classList.remove('visible');
    updateButtonLabel(paymentInputs[0].value);
  };

  // Listen to changes to the payment method selector.
  for (let input of document.querySelectorAll('input[name=payment]')) {
    input.addEventListener('change', event => {
      event.preventDefault();
      const payment = form.querySelector('input[name=payment]:checked').value;
      const flow = paymentMethods[payment].flow;

      // Update button label.
      updateButtonLabel(event.target.value);

      // Show the relevant details, whether it's an extra element or extra information for the user.
      form
        .querySelector('.payment-info.card')
        .classList.toggle('visible', payment === 'card');
      form
        .querySelector('.payment-info.sepa_debit')
        .classList.toggle('visible', payment === 'sepa_debit');
      form
        .querySelector('.payment-info.wechat')
        .classList.toggle('visible', payment === 'wechat');
      form
        .querySelector('.payment-info.redirect')
        .classList.toggle('visible', flow === 'redirect');
      form
        .querySelector('.payment-info.receiver')
        .classList.toggle('visible', flow === 'receiver');
      form
        .querySelector('.payment-info.paypal')
        .classList.toggle('visible', flow === 'paypal');
      document
        .getElementById('card-errors')
        .classList.remove('visible', payment !== 'card');
    });
  }

  // Select the default country from the config on page load.
  const countrySelector = document.getElementById('country');
  countrySelector.querySelector(`option[value=${'DE'}]`).selected =
    'selected';
  countrySelector.className = `ddsco-field ${'DE'}`;
  // Create a map of the button ids and course names
  const courseIdNameMap = new Map();
  courseIdNameMap.set('pay-ww', 'Wiener Walzer');
  courseIdNameMap.set('pay-lw', 'Langsamer Walzer');
  courseIdNameMap.set('pay-df', 'Discofox');
  // Create references to payment trigger buttons
  const btnWw = document.getElementById('pay-ww');
  const btnLw = document.getElementById('pay-lw');
  const btnDf = document.getElementById('pay-df');
  // Listen to clicks on payment trigger buttons and update the item in the order accordingly
  const inputPaymentValue = (btnEvent) => {
    courseName = courseIdNameMap.get(btnEvent.target.id);
    console.log('User wants to pay for...', courseName);
    store.flushItemList();
    store.addItemToList(courseName);
    amount = store.getOrderTotal();

    const paymentInputs = form.querySelectorAll('input[name=payment]');
    for (let i = 0; i < paymentInputs.length; i++) {
        let input = paymentInputs[i];
        if (input.checked) {
          updateButtonLabel(input.value);
          break;
        }
    }
  };

  if (btnDf) btnDf.onclick = inputPaymentValue;
  if (btnLw) btnLw.onclick = inputPaymentValue;
  if (btnWw) btnWw.onclick = inputPaymentValue;

  // Trigger the method to show relevant payment methods on page load.
  showRelevantPaymentMethods();
})();

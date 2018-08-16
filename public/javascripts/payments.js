"use strict";

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

(async function () {
    "use strict";

    // Retrieve the configuration for the store.

    var config = await store.getConfig();

    var amount = 0;
    var courseName = "";
    var isMobile = function isMobile() {
        return window.matchMedia("only screen and (max-width: 760px)").matches;
    };

    // Create references to the main form and its submit button.
    var form = document.getElementById("payment-form");
    var submitButton = form.querySelector("button[type=submit]");

    /* Google analytics */
    var trackCourseBuy = function trackCourseBuy() {
        ga("send", {
            hitType: "event",
            eventCategory: "kurs",
            eventAction: "checkout_success",
            eventLabel: courseName,
            eventValue: amount / 100
        });
    };

    /**
     * Setup Stripe Elements.
     */

        // Create a Stripe client.
    var stripe = Stripe(config.stripePublishableKey);

    // Create an instance of Elements.
    var elements = stripe.elements();

    // Prepare the options for Elements to be styled accordingly.
    var elementsOptions = {
        style: {
            base: {
                iconColor: "#666ee8",
                color: "#31325f",
                fontWeight: 400,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                fontSmoothing: "antialiased",
                fontSize: "15px",
                "::placeholder": {
                    color: "#aab7c4"
                },
                ":-webkit-autofill": {
                    color: "#666ee8"
                }
            }
        }
    };

    /**
     * Implement a Stripe Card Element that matches the look-and-feel of the app.
     *
     * This makes it easy to collect debit and credit card payments information.
     */

        // Create a Card Element and pass some custom styles to it.
    var card = elements.create("card", elementsOptions);

    // Mount the Card Element on the page.
    card.mount("#card-element");

    // Monitor change events on the Card Element to display any errors.
    card.addEventListener("change", function (_ref) {
        var error = _ref.error;

        var cardErrors = document.getElementById("card-errors");
        if (error) {
            cardErrors.textContent = error.message;
            cardErrors.classList.add("visible");
        } else {
            cardErrors.classList.remove("visible");
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
     * Implement a Stripe IBAN Element that matches the look-and-feel of the app.
     *
     * This makes it easy to collect bank account information.
     */

        // Create a IBAN Element and pass the right options for styles and supported countries.
    var iban = elements.create("iban", {
            style: elementsOptions["style"],
            supportedCountries: ["SEPA"]
        });

    // Mount the IBAN Element on the page.
    iban.mount("#iban-element");

    // Monitor change events on the IBAN Element to display any errors.
    iban.on("change", function (_ref2) {
        var error = _ref2.error,
            bankName = _ref2.bankName;

        var ibanErrors = document.getElementById("iban-errors");
        if (error) {
            ibanErrors.textContent = error.message;
            ibanErrors.classList.add("visible");
        } else {
            ibanErrors.classList.remove("visible");
            if (bankName) {
                updateButtonLabel("sepa_debit", bankName);
            }
        }
        // Re-enable the Pay button.
        submitButton.disabled = false;
    });

    /**
     * Implement a PayPal Checkout button.
     *
     */
    var isAgbsChecked = function isAgbsChecked() {
        return document.getElementById("ddsco-agbs").checked;
    };

    var toggleButton = function toggleButton(actions) {
        return isAgbsChecked() && amount ? actions.enable() : actions.disable();
    };

    function toggleValidationMessage() {
        if (!form.checkValidity()) {
            // Create the temporary button, click and remove it
            var tmpSubmit = document.createElement("button");
            form.appendChild(tmpSubmit);
            tmpSubmit.click();
            form.removeChild(tmpSubmit);
        }
    }

    function onChangeCheckbox(handler) {
        document.getElementById("ddsco-agbs").addEventListener("change", handler);
    }

    paypal.Button.render(
        {
            env: "production", // sandbox | production
            locale: "de_DE",

            // PayPal Client IDs - replace with your own
            // Create a PayPal app: https://developer.paypal.com/developer/applications/create
            client: {
                sandbox: "",
                production:
                    "AbRWBZnmecOZ6uTdLcqKWOukOCq5LiKmTDIZUSeb0olKO2U2FpOlN0ysMI0mR3r6SEsl6iPsbpOuh4xa"
            },
            style: {
                label: "paypal",
                size: "responsive", // small | medium | large | responsive
                shape: "rect", // pill | rect
                color: "blue", // gold | blue | silver | black
                tagline: false
            },

            // Show the buyer a 'Pay Now' button in the checkout flow
            commit: true,

            validate: function validate(actions) {
                toggleButton(actions);

                onChangeCheckbox(function () {
                    toggleButton(actions);
                });
            },

            // payment() is called when the button is clicked
            payment: function payment(data, actions) {
                // Make a call to the REST api to create the payment
                return actions.payment.create({
                    payment: {
                        intent: "sale",
                        transactions: [
                            {
                                amount: {
                                    total: amount / 100,
                                    currency: "EUR"
                                },
                                description: courseName,
                                reference_id: courseName
                                    .toLocaleLowerCase()
                                    .split(" ")
                                    .join("-"),
                                item_list: {
                                    items: [
                                        {
                                            name: courseName,
                                            sku: "1",
                                            price: (amount / 100).toString() + ".00",
                                            currency: "EUR",
                                            quantity: "1",
                                            description: courseName
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                });
            },

            // onAuthorize() is called when the buyer approves the payment
            onAuthorize: function onAuthorize(data, actions) {
                // Make a call to the REST api to execute the payment
                return actions.payment.execute().then(function () {
                    showConfirmationScreen();
                    trackCourseBuy();
                    register_purchase('Purchase', store.getOrderTotal() / 100)
                });
            },
            // called if the buyer cancels the payment
            // By default, the buyer is returned to the original page,
            // but you're free to use this function to take them to a different page.
            onCancel: function onCancel(data, actions) {
                /*
                     * Buyer cancelled the payment
                     */
            },
            // called when an error occurs
            // You can allow the buyer to re-try or show an error message
            onError: function onError(err) {
                /*
                     * An error occurred during the transaction
                     */
                showErrorScreen(err.message);
            },
            // called for every click on the PayPal button
            onClick: function onClick() {
                toggleValidationMessage();
            }
        },
        "#paypal-button-container"
    );

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
        .querySelector("select[name=country]")
        .addEventListener("change", function (event) {
            event.preventDefault();
            var country = event.target.value;
            event.target.parentElement.className = "ddsco-field " + country;
            showRelevantPaymentMethods(country);
        });

    // Submit handler for our payment form.
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Retrieve the user information from the form.
        var payment = form.querySelector("input[name=payment]:checked").value;
        var name = form.querySelector("input[name=name]").value;
        var country = form.querySelector("select[name=country] option:checked")
            .value;
        var email = form.querySelector("input[name=email]").value;
        // Disable the Pay button to prevent multiple click events.
        submitButton.disabled = true;

        // Create the order using the email and shipping information from the form.
        var order = await store.createOrder("eur", store.getOrderItems(), email, name, country);

        if (payment === "card") {
            // Create a Stripe source from the card information and the owner name.
            var _ref3 = await stripe.createSource(card, {
                    owner: {
                        name: name
                    },
                    metadata: {
                        course: courseName
                    }
                }),
                source = _ref3.source;

            await handleOrder(order, source);
        } else if (payment === "sepa_debit") {
            // Create a SEPA Debit source from the IBAN information.
            var sourceData = {
                type: payment,
                currency: order.currency,
                owner: {
                    name: name,
                    email: email
                },
                mandate: {
                    // Automatically send a mandate notification email to your customer
                    // once the source is charged.
                    notification_method: "email"
                },
                metadata: {
                    course: courseName
                }
            };

            var _ref4 = await stripe.createSource(iban, sourceData),
                _source = _ref4.source;

            await handleOrder(order, _source);
        } else {
            // Prepare all the Stripe source common data.
            var _sourceData = {
                type: payment,
                amount: order.amount,
                currency: order.currency,
                owner: {
                    name: name,
                    email: email
                },
                redirect: {
                    return_url: window.location.href
                },
                statement_descriptor: "Doodance Stripe Payments",
                metadata: {
                    order: order.id,
                    course: courseName
                }
            };

            // Add extra source information which are specific to a payment method.
            switch (payment) {
                case "sepa_debit":
                    // SEPA Debit: Pass the IBAN entered by the user.
                    _sourceData.sepa_debit = {
                        iban: form.querySelector("input[name=iban]").value
                    };
                    break;
            }

            // Create a Stripe source with the common data and extra information.

            var _ref5 = await stripe.createSource(_sourceData),
                _source2 = _ref5.source,
                error = _ref5.error;

            await handleOrder(order, _source2, error);
        }
    });

    var showConfirmationScreen = function showConfirmationScreen() {
        var mainElement = document.getElementById("ddsco-main");
        // Success! Payment is confirmed.
        // hide PayPal button
        document.getElementById("paypal-button-container").style.display = "none";
        // hide course title
        if (!onKassePages()){
            document.getElementById("ddsco-course-title").style.display = "none";
        }
        // hide form
        document.getElementById("payment-form").style.display = "none";
        // hide validation errors
        document.getElementById("card-errors").style.display = "none";
        document.getElementById("iban-errors").style.display = "none";
        // Update the interface to display the confirmation screen.
        mainElement.classList.remove("processing");
        mainElement.classList.add("success");
        if (isMobile() || onKassePages()) {
            document.getElementById("ddsco-redirect-home-btn").style.display =
                "block";
        } else {
            document.getElementById("ddsco-close-popup-btn").style.display = "block";
            document.getElementById("ddsco-close-popup-btn").onclick = function () {
                payCoursePopUpElement.style.display = "none";
            };
        }
        document.getElementById("ddsco-confirmation").style.display = "initial";
    };

    var showProcessingScreen = function showProcessingScreen() {
        var mainElement = document.getElementById("ddsco-main");
        // hide PayPal button
        document.getElementById("paypal-button-container").style.display = "none";
        // hide course title
        if (!onKassePages()) {
            document.getElementById("ddsco-course-title").style.display = "none";
        }
        // hide form
        document.getElementById("payment-form").style.display = "none";
        // hide validation errors
        document.getElementById("card-errors").style.display = "none";
        document.getElementById("iban-errors").style.display = "none";
        // Success! Now waiting for payment confirmation. Update the interface to display the confirmation screen.
        mainElement.classList.remove("processing");
        document.getElementById("ddsco-confirmation").style.display = "initial";
        // Update the note about receipt and shipping (the payment is not yet confirmed by the bank).
        // confirmationElement.querySelector('.note').innerText =
        //     'We’ll send your receipt and ship your items as soon as your payment is confirmed.';
        mainElement.classList.add("success");
    };

    var showErrorScreen = function showErrorScreen(failureMessage) {
        ga("send", {
            hitType: "event",
            eventCategory: "kurs",
            eventAction: "checkout_failed",
            eventLabel: courseName
        });
        var mainElement = document.getElementById("ddsco-main");
        // Payment for the order has failed.
        // hide PayPal button
        document.getElementById("paypal-button-container").style.display = "none";
        // hide course title
        if (!onKassePages()) {
            document.getElementById("ddsco-course-title").style.display = "none";
        }
        // hide form
        document.getElementById("payment-form").style.display = "none";
        // hide validation errors
        document.getElementById("card-errors").style.display = "none";
        document.getElementById("iban-errors").style.display = "none";
        // display the wrapper
        document.getElementById("ddsco-confirmation").style.display = "initial";
        // display the failure reasure
        document.getElementById(
            "ddsco-payment-error-msg"
        ).innerText = failureMessage;
        // display the button for closing the pop-up
        if (isMobile() || onKassePages()) {
            document.getElementById("ddsco-redirect-home-btn").textContent =
                "Zurück zum Checkout";
            document.getElementById("ddsco-redirect-home-btn").style.display =
                "block";
            document.getElementById("ddsco-redirect-home-btn").onclick = resetForm;
        } else {
            document.getElementById("ddsco-close-popup-btn").textContent =
                "Zurück zum Checkout";
            document.getElementById("ddsco-close-popup-btn").style.display = "block";
        }
        // update CSS classes
        mainElement.classList.remove("success");
        mainElement.classList.remove("processing");
        mainElement.classList.add("error");
    };

    var resetForm = function resetForm() {
        var mainElement = document.getElementById("ddsco-main");
        mainElement.classList.remove("success");
        mainElement.classList.remove("processing");
        mainElement.classList.remove("error");
        mainElement.classList.add("checkout");
        // hide the button for closing the pop-up
        if (isMobile()) {
            document.getElementById("ddsco-redirect-home-btn").display = "none";
        } else {
            document.getElementById("ddsco-close-popup-btn").style.display = "none";
        }
        document.getElementById("payment-form").style.display = "block";
        if (!onKassePages()) {
            document.getElementById("ddsco-course-title").style.display = "block";
        }
        document.getElementById("card-errors").style.display = "none";
        document.getElementById("iban-errors").style.display = "none";
        // show PayPal button
        document.getElementById("paypal-button-container").style.display = "block";
        // hide confirmation
        document.getElementById("ddsco-confirmation").style.display = "none";
        document.getElementById("ddsco-payment-error-msg").innerText = "";
        //empty/reset input fields
        card.clear();
        iban.clear();
        form.reset();
        showRelevantPaymentMethods();
    };

    // Handle the order and source activation if required
    var handleOrder = async function handleOrder(order, source) {
        switch (order.status) {
            case "created":
                switch (source.status) {
                    case "chargeable":
                        submitButton.textContent = submitButton.dataset.textVorgang;
                        var response = await store.payOrder(order, source);
                        await handleOrder(response.order, response.source);
                        break;
                    case "pending":
                        switch (source.flow) {
                            case "none":
                                // Normally, sources with a `flow` value of `none` are chargeable right away,
                                // but there are exceptions, for instance for WeChat QR codes just below.
                                break;
                            case "redirect":
                                // Immediately redirect the customer.
                                submitButton.textContent = "Redirecting…";
                                window.location.replace(source.redirect.url);
                                break;
                            case "code_verification":
                                // Display a code verification input to verify the source.
                                break;
                            default:
                                // Order is received, pending payment confirmation.
                                break;
                        }
                        break;
                    case "failed":
                        break;
                    case "canceled":
                        // Authentication failed, offer to select another payment method.
                        break;
                    default:
                        // Order is received, pending payment confirmation.
                        break;
                }
                break;

            case "pending":
                showConfirmationScreen();
                trackCourseBuy();
                break;

            case "failed":
                showErrorScreen(order.metadata.errorMessage);
                break;

            case "paid":
                showConfirmationScreen();
                trackCourseBuy();
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

    var pollOrderStatus = async function pollOrderStatus(orderId) {
        var timeout =
            arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 30000;
        var interval =
            arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
        var start =
            arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        start = start ? start : Date.now();
        var endStates = ["paid", "failed"];
        // Retrieve the latest order status.
        var order = await store.getOrderStatus(orderId);
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
                console.warn(new Error("Polling timed out."));
            }
        }
    };

    var orderId = store.getActiveOrderId();
    var mainElement = document.getElementById("ddsco-main");
    if (orderId && window.location.search.includes("source")) {
        // Update the interface to display the processing screen.
        mainElement.classList.add("success", "processing");

        // Poll the backend and check for an order status.
        // The backend updates the status upon receiving webhooks,
        // specifically the `source.chargeable` and `charge.succeeded` events.
        pollOrderStatus(orderId);
    } else {
        // Update the interface to display the checkout form.
        mainElement.classList.add("checkout");
    }

    /**
     * Display the relevant payment methods for a selected country.
     */

        // List of relevant countries for the payment methods supported in this demo.
        // Read the Stripe guide: https://stripe.com/payments/payment-methods-guide
    var paymentMethods = {
            card: {
                name: "Card",
                flow: "none"
            },
            // giropay: {
            //   name: 'Giropay',
            //   flow: 'redirect',
            //   countries: [],
            // },
            sepa_debit: {
                name: "SEPA Direct Debit",
                flow: "none",
                countries: ["FR", "DE", "ES", "BE", "NL", "LU", "IT", "PT", "AT", "IE"]
            },
            sofort: {
                name: "SOFORT",
                flow: "redirect",
                countries: ["DE", "AT"]
            },
            paypal: {
                name: "PayPal",
                flow: "paypal"
            }
        };

    // Update the main button to reflect the payment method being selected.
    var updateButtonLabel = function updateButtonLabel(paymentMethod) {
        if (paymentMethod === "paypal") {
            submitButton.style.display = "none";
            document.getElementById("paypal-button-container").style.display =
                "initial";
        } else {
            // let amount = store.formatPrice(store.getOrderTotal(), 'eur');
            submitButton.innerText = submitButton.dataset.textKaufen;
            document.getElementById("paypal-button-container").style.display = "none";
            submitButton.style.display = "initial";
        }
    };

    // Show only the payment methods that are relevant to the selected country.
    var showRelevantPaymentMethods = function showRelevantPaymentMethods(
        country
    ) {
        if (!country) {
            country = form.querySelector("select[name=country] option:checked").value;
        }

        var paymentInputs = form.querySelectorAll("input[name=payment]");
        for (var i = 0; i < paymentInputs.length; i++) {
            var input = paymentInputs[i];
            input.parentElement.classList.toggle(
                "visible",
                input.value === "paypal" ||
                input.value === "card" ||
                paymentMethods[input.value].countries.includes(country)
            );
        }

        // Hide the tabs if card is the only available option.
        var paymentMethodsTabs = document.getElementById("payment-methods");
        paymentMethodsTabs.classList.toggle(
            "visible",
            paymentMethodsTabs.querySelectorAll("li.visible").length > 1
        );

        // Check the first payment option again.
        paymentInputs[0].checked = "checked";
        form.querySelector(".payment-info.paypal").classList.add("visible");
        form.querySelector(".payment-info.card").classList.remove("visible");
        form.querySelector(".payment-info.sepa_debit").classList.remove("visible");
        form.querySelector(".payment-info.redirect").classList.remove("visible");
        updateButtonLabel(paymentInputs[0].value);
    };

    // Listen to changes to the payment method selector.
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (
            var _iterator = document
                    .querySelectorAll("input[name=payment]")
                    [Symbol.iterator](),
                _step;
            !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
            _iteratorNormalCompletion = true
        ) {
            var input = _step.value;

            input.addEventListener("change", function (event) {
                event.preventDefault();
                var payment = form.querySelector("input[name=payment]:checked").value;
                var flow = paymentMethods[payment].flow;

                // Update button label.
                updateButtonLabel(event.target.value);

                // Show the relevant details, whether it's an extra element or extra information for the user.
                form
                    .querySelector(".payment-info.card")
                    .classList.toggle("visible", payment === "card");
                form
                    .querySelector(".payment-info.sepa_debit")
                    .classList.toggle("visible", payment === "sepa_debit");
                form
                    .querySelector(".payment-info.redirect")
                    .classList.toggle("visible", flow === "redirect");
                form
                    .querySelector(".payment-info.paypal")
                    .classList.toggle("visible", flow === "paypal");
                document
                    .getElementById("card-errors")
                    .classList.remove("visible", payment !== "card");
            });
        }

        // Select the default country from the config on page load.
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var countrySelector = document.getElementById("country");
    countrySelector.querySelector("option[value=" + "DE" + "]").selected =
        "selected";
    countrySelector.className = "ddsco-field " + "DE";
    // Listen to clicks on payment trigger buttons and update the item in the order accordingly
    var inputPaymentValue = function inputPaymentValue(btnEvent) {
        courseName = courseIdNameMap.get(btnEvent.target.id);
        displaySelectedCourse();
    };

    var displaySelectedCourse = function displaySelectedCourse() {
        ga("send", {
            hitType: "event",
            eventCategory: "kurs",
            eventAction: "checkout_opened",
            eventLabel: courseName
        });
        store.flushItemList();
        store.addItemToList(courseName);
        amount = store.getOrderTotal();
        // display course name & amount
        if (!onKassePages()) {
            document.getElementById("ddsco-course-title").innerText =
                courseName + " " + (amount / 100).toString() + "€";
        }
        // update button label with amount
        var paymentInputs = form.querySelectorAll("input[name=payment]");
        for (var i = 0; i < paymentInputs.length; i++) {
            var input = paymentInputs[i];
            if (input.checked) {
                updateButtonLabel(input.value);
                break;
            }
        }
    };

    // clicking on the agbs checkbox text ticks the checkbox
    document.getElementById("ddsco-agbs-text").onclick = function () {
        document.getElementById("ddsco-agbs").checked = !document.getElementById(
            "ddsco-agbs"
        ).checked;
    };

    // Create a map of the button ids and course names
    var courseIdNameMap = new Map();
    courseIdNameMap.set("pay-ww", "Wiener Walzer");
    courseIdNameMap.set("kasse-ww", "Wiener Walzer");
    courseIdNameMap.set("pay-ww-2", "Wiener Walzer");
    courseIdNameMap.set("pay-ww-3", "Wiener Walzer");
    courseIdNameMap.set("pay-ww-4", "Wiener Walzer");
    courseIdNameMap.set("pay-ww-5", "Wiener Walzer");
    courseIdNameMap.set("checkout-wiener-walzer", "Wiener Walzer");
    courseIdNameMap.set("pay-lw", "Langsamer Walzer");
    courseIdNameMap.set("kasse-lw", "Langsamer Walzer");
    courseIdNameMap.set("pay-lw-2", "Langsamer Walzer");
    courseIdNameMap.set("pay-lw-3", "Langsamer Walzer");
    courseIdNameMap.set("pay-lw-4", "Langsamer Walzer");
    courseIdNameMap.set("pay-lw-5", "Langsamer Walzer");
    courseIdNameMap.set("checkout-langsamer-walzer", "Langsamer Walzer");
    courseIdNameMap.set("pay-lw-mobile", "Langsamer Walzer");
    courseIdNameMap.set("pay-df", "Discofox");
    courseIdNameMap.set("kasse-df", "Discofox");
    courseIdNameMap.set("pay-df-2", "Discofox");
    courseIdNameMap.set("pay-df-3", "Discofox");
    courseIdNameMap.set("pay-df-4", "Discofox");
    courseIdNameMap.set("pay-df-5", "Discofox");
    courseIdNameMap.set("checkout-discofox", "Discofox");
    courseIdNameMap.set("pay-df-mobile", "Discofox");

    var setBtnListeners = function setBtnListeners() {
        // Create references to payment trigger buttons
        //wiener walzer
        var btnWw = document.getElementById("pay-ww");
        var btnWw2 = document.getElementById("pay-ww-2");
        var btnWw3 = document.getElementById("pay-ww-3");
        var btnWw4 = document.getElementById("pay-ww-4");
        var btnWw5 = document.getElementById("pay-ww-5");
        var btnWwMob = document.getElementById("pay-ww-mobile");
        var btnWwMob2 = document.getElementById("pay-ww-mobile-2");
        var btnWwMob3 = document.getElementById("pay-ww-mobile-3");
        var btnWwMob4 = document.getElementById("pay-ww-mobile-4");
        var btnWwMob5 = document.getElementById("pay-ww-mobile-5");
        if (btnWw) btnWw.onclick = inputPaymentValue;
        if (btnWw2) btnWw2.onclick = inputPaymentValue;
        if (btnWw3) btnWw3.onclick = inputPaymentValue;
        if (btnWw4) btnWw4.onclick = inputPaymentValue;
        if (btnWw5) btnWw5.onclick = inputPaymentValue;
        if (btnWwMob) btnWwMob.onclick = inputPaymentValue;
        if (btnWwMob2) btnWwMob2.onclick = inputPaymentValue;
        if (btnWwMob3) btnWwMob3.onclick = inputPaymentValue;
        if (btnWwMob4) btnWwMob4.onclick = inputPaymentValue;
        if (btnWwMob5) btnWwMob5.onclick = inputPaymentValue;
        //langsamer walzer
        var btnLw = document.getElementById("pay-lw");
        var btnLw2 = document.getElementById("pay-lw-2");
        var btnLw3 = document.getElementById("pay-lw-3");
        var btnLw4 = document.getElementById("pay-lw-4");
        var btnLw5 = document.getElementById("pay-lw-5");
        var btnLwMob = document.getElementById("pay-lw-mobile");
        var btnLwMob2 = document.getElementById("pay-lw-mobile-2");
        var btnLwMob3 = document.getElementById("pay-lw-mobile-3");
        var btnLwMob4 = document.getElementById("pay-lw-mobile-4");
        var btnLwMob5 = document.getElementById("pay-lw-mobile-5");
        if (btnLw) btnLw.onclick = inputPaymentValue;
        if (btnLw2) btnLw3.onclick = inputPaymentValue;
        if (btnLw3) btnLw3.onclick = inputPaymentValue;
        if (btnLw4) btnLw4.onclick = inputPaymentValue;
        if (btnLw5) btnLw5.onclick = inputPaymentValue;
        if (btnLwMob) btnLwMob.onclick = inputPaymentValue;
        if (btnLwMob2) btnLwMob2.onclick = inputPaymentValue;
        if (btnLwMob3) btnLwMob3.onclick = inputPaymentValue;
        if (btnLwMob4) btnLwMob4.onclick = inputPaymentValue;
        if (btnLwMob5) btnLwMob5.onclick = inputPaymentValue;
        //discofox
        var btnDf = document.getElementById("pay-df");
        var btnDf2 = document.getElementById("pay-df-2");
        var btnDf3 = document.getElementById("pay-df-3");
        var btnDf4 = document.getElementById("pay-df-4");
        var btnDf5 = document.getElementById("pay-df-5");
        var btnDfMob = document.getElementById("pay-df-mobile");
        var btnDfMob2 = document.getElementById("pay-df-mobile-2");
        var btnDfMob3 = document.getElementById("pay-df-mobile-3");
        var btnDfMob4 = document.getElementById("pay-df-mobile-4");
        var btnDfMob5 = document.getElementById("pay-df-mobile-5");
        if (btnDf) btnDf.onclick = inputPaymentValue;
        if (btnDf2) btnDf2.onclick = inputPaymentValue;
        if (btnDf3) btnDf3.onclick = inputPaymentValue;
        if (btnDf4) btnDf4.onclick = inputPaymentValue;
        if (btnDf5) btnDf5.onclick = inputPaymentValue;
        if (btnDfMob) btnDfMob.onclick = inputPaymentValue;
        if (btnDfMob2) btnDfMob2.onclick = inputPaymentValue;
        if (btnDfMob3) btnDfMob3.onclick = inputPaymentValue;
        if (btnDfMob4) btnDfMob4.onclick = inputPaymentValue;
        if (btnDfMob5) btnDfMob5.onclick = inputPaymentValue;
    };

    setBtnListeners();

    // buttons for closing the modal
    var payCoursePopUpElement = document.getElementsByClassName("pay-course")[0];
    var btnClosePopUp = document.getElementById("ddsco-close-popup-btn");
    var btnClosePopUpX = document.getElementById("ddsco-close-popup-x-btn");
    var popupBackground = document.querySelectorAll(
        "[data-ix=hide-payment-form]"
    )[0];

    if (btnClosePopUp) {
        btnClosePopUp.addEventListener("click", function () {
            resetForm();
        });
    }

    if (btnClosePopUpX) {
        btnClosePopUpX.addEventListener("click", function () {
            payCoursePopUpElement.style.display = "none";
            resetForm();
        });
    }

    if (popupBackground) {
        popupBackground.addEventListener("click", function () {
            payCoursePopUpElement.style.display = "none";
            resetForm();
        });
    }

    var readUrl = function readUrl() {
        var courseKey = window.location.href.substr(
            window.location.href.lastIndexOf("/") + 1
        );
        courseName = courseIdNameMap.get(courseKey);
        if (courseName) {
            displaySelectedCourse();
        }
    };

    var onKassePages = function onKassePages() {
        var courseKey = window.location.href.substr(
            window.location.href.lastIndexOf("/") + 1
        );
        return (['kasse-ww','kasse-lw','kasse-df'].indexOf(courseKey) > -1);
    };

    // Trigger the method to show relevant payment methods on page load.
    showRelevantPaymentMethods();
    readUrl();
})();

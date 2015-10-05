// Stripe payment form views

var ko = require('knockout'),
    payment = require('jquery.payment'),
    $ = require('jquery'),
    stripe = null;


// TODO stripe doesn't support loading locally very well, do they?
if (typeof(window) != 'undefined' && typeof(window.Stripe) != 'undefined') {
    stripe = window.Stripe || {};
}

function PaymentView (config) {
    var self = this,
        config = config || {};

    // Config
    stripe.publishableKey = self.stripe_key = config.key;
    self.form = config.form;

    // Credit card parameters
    self.cc_number = ko.observable(null);
    self.cc_expiry = ko.observable(null);
    self.cc_cvv = ko.observable(null);
    self.error_cc_number = ko.observable(null);
    self.error_cc_expiry = ko.observable(null);
    self.error_cc_cvv = ko.observable(null);

    // Credit card validation
    self.initialize_form();

    // Outputs
    self.error = ko.observable(null);

    // Process form inputs and send API request to Stripe. Using jquery.payment
    // for some validation, display field errors and some generic errors.
    self.process_form = function () {
        var expiry = $.payment.cardExpiryVal(self.cc_expiry()),
            card = {
                number: self.cc_number(),
                exp_month: expiry.month,
                exp_year: expiry.year,
                cvc: self.cc_cvv()
            };

        self.error(null);
        self.error_cc_number(null);
        self.error_cc_expiry(null);
        self.error_cc_cvv(null);

        if (!$.payment.validateCardNumber(card.number)) {
            self.error_cc_number('Invalid card number');
            return false;
        }
        if (!$.payment.validateCardExpiry(card.exp_month, card.exp_year)) {
            self.error_cc_expiry('Invalid expiration date');
            return false;
        }
        if (!$.payment.validateCardCVC(card.cvc)) {
            self.error_cc_cvv('Invalid security code');
            return false;
        }

        stripe.createToken(card, function(status, response) {
            if (status === 200) {
                self.submit_form(response.card.last4, response.id);
            }
            else {
                self.error(response.error.message);
            }
        });
    };
}

PaymentView.prototype.submit_form = function (card_digits, token) {
    this.form.find('#id_last_4_digits,#id_card_digits').val(card_digits);
    this.form.find('#id_stripe_id,#id_stripe_token').val(token);
    this.form.submit();
};

PaymentView.prototype.initialize_form = function () {
    var cc_number = $('input#cc-number'),
        cc_cvv = $('input#cc-cvv'),
        cc_expiry = $('input#cc-expiry');

    cc_number.payment('formatCardNumber');
    cc_expiry.payment('formatCardExpiry');
    cc_cvv.payment('formatCardCVC');
};

PaymentView.init = function (config, obj) {
    var view = new GoldView(config),
        obj = obj || $('#payment-form')[0];
    ko.applyBindings(view, obj);
    return view;
}

module.exports.PaymentView = PaymentView;

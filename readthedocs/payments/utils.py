"""Payment utility functions"""

import stripe
from django.conf import settings

stripe.api_key = getattr(settings, 'STRIPE_SECRET', None)


def cancel_subscription(customer_id, subscription_id):
    """Cancel Stripe subscription, if it exists"""
    try:
        customer = stripe.Customer.retrieve(customer_id)
        if hasattr(customer, 'subscriptions'):
            subscription = customer.subscriptions.retrieve(subscription_id)
            subscription.delete()
    except stripe.error.StripeError as e:
        pass

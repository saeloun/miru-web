# frozen_string_literal: true

Stripe.api_key = ENV["STRIPE_SECRET_KEY"].presence || (Rails.env.test? ? "sk_test_dummy" : nil)

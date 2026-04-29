# frozen_string_literal: true

FactoryBot.define do
  factory :razorpay_payout do
    payment
    amount { payment.amount }
    currency { "INR" }
    status { :pending }
    triggered_by { :automatic }
    sequence(:reference_id) { |number| "miru-payout-#{number}" }
    idempotency_key { SecureRandom.uuid }
    mode { "UPI" }
    recipient_upi_id { "vendor@upi" }
    recipient_name { "Vendor" }
    recipient_email { "vendor@example.com" }
  end
end

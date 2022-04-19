# frozen_string_literal: true

Pay.setup do |config|
  # For use in the receipt/refund/renewal mailers
  config.business_name = "Saeloun Inc"
  config.business_address = "475 Clermont Avenue, Apartment 1232, Brooklyn, NY-11238"
  config.application_name = "Miru Web"
  config.support_email = "miru-review@saeloun.com"

  config.default_product_name = "default"
  config.default_plan_name = "default"
end

# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

# The data is already formatted by PaymentsPresenter
json.payments payments
json.base_currency current_company.base_currency

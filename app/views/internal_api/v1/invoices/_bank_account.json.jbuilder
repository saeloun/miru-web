# frozen_string_literal: true

json.bank_name bank_account&.bank_name
json.account_type bank_account&.account_type&.capitalize
json.routing_number bank_account&.routing_number
json.account_number bank_account&.account_number

# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.id wise_account&.id
json.profile_id wise_account&.profile_id
json.recipient_id wise_account&.recipient_id
json.source_currency wise_account&.source_currency
json.target_currency wise_account&.target_currency
json.user_id wise_account&.user_id
json.company_id wise_account&.company_id

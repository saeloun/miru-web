# frozen_string_literal: true

json.extract! user, :id, :first_name, :last_name, :date_of_birth, :phone, :personal_email_id, :social_accounts
json.date_format current_company.date_format
json.avatar_url user.avatar_url

# frozen_string_literal: true

json.extract! user, :first_name, :last_name, :date_of_birth, :phone, :personal_email_id, :social_accounts
json.date_format current_company.date_format
json.avatar_url url_for(user.avatar)

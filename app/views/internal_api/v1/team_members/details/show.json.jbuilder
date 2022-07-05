# frozen_string_literal: true

json.details do
  json.first_name user.first_name
  json.last_name user.last_name
  json.date_of_birth user.date_of_birth
  json.phone user.phone
  json.personal_email_id user.personal_email_id
  json.github_url user.social_accounts['github_url']
  json.linkedin_url user.social_accounts['linkedin_url']
end

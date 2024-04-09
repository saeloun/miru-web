# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.user do
  json.extract! user, :id, :first_name, :last_name, :email
  json.name user.full_name
  json.role user.primary_role(current_company)
  json.status user.confirmed_at?
  json.is_team_member true
  json.data_type "Team"
  json.profile_picture user_avatar user
  json.employment_type employment&.employment_type
  json.joined_at_date employment&.joined_at
end

json.notice I18n.t("team.update.success.message")

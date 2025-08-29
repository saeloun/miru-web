# frozen_string_literal: true

json.notice I18n.t("invitation.create.success.message")
json.invitation do
  json.id invitation.id
  json.name invitation.full_name
  json.first_name invitation.first_name
  json.last_name invitation.last_name
  json.email invitation.recipient_email
  json.role invitation.role
  json.status invitation.accepted_at?
  json.is_team_member invitation.accepted_at?
end
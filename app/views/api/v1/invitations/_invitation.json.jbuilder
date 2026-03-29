# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.invitation do
  json.id invitation.id
  json.name invitation.full_name
  json.first_name invitation.first_name
  json.last_name invitation.last_name
  json.email invitation.recipient_email
  json.role invitation.role
  json.status invitation.accepted_at?
  json.is_team_member invitation.accepted_at?
  json.profile_picture image_url "avatar.svg"
end

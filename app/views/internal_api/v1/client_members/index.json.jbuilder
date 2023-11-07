# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.virtual_verified_invitations_allowed @virtual_verified_invitations_allowed

json.client_members client_members.each do |client_member|
  json.contact_id client_member.id
  json.user_id client_member.user.id
  json.first_name client_member.user.first_name
  json.last_name client_member.user.last_name
  json.email client_member.user.email
end

json.invitations invitations

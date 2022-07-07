# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

def team_member_status(member)
  return unless current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    member.unconfirmed_email?

  I18n.t("team.reconfirmation")
end

def invited_user_status
  return unless current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)

  I18n.t("team.invitation")
end

json.team teams do |member|
  json.profile_picture user_avatar(member)
  json.id member.id
  json.name member.full_name
  json.email member.email
  json.role member.primary_role
  json.status team_member_status(member)
end

json.invitation invitations do |member|
  json.profile_picture image_url "avatar.svg"
  json.id member.id
  json.name member.full_name
  json.email member.recipient_email
  json.role member.role
  json.status invited_user_status
end

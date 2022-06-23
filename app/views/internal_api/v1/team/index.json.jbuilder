# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

def status(member)
  if current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    if member.unconfirmed_email?
      I18n.t("team.reconfirmation")
    elsif member.created_by_invite? && !member.invitation_accepted? && !member.has_role?(:owner, current_company)
      I18n.t("team.invitation")
    end
  end
end

json.team team do |member|
  json.profile_picture user_avatar(member.user)
  json.id member.user.id
  json.first_name member.user.first_name
  json.last_name member.user.last_name
  json.name member.user.full_name
  json.email member.user.email
  json.role member.user_role
  json.status status(member.user)
end

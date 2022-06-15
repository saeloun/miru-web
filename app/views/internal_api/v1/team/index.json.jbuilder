# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

def status(member)

  if current_user.has_owner_or_admin_role?(current_company)
    if member.unconfirmed_email?
      I18n.t('team.reconfirmation')
    elsif member.created_by_invite? && !member.invitation_accepted? && !member.has_role?(:owner, current_company)
       I18n.t('team.invitation')
    end
  end
end

json.team team do |member|
  json.profile_picture user_avatar(member)
  json.name member.full_name
  json.email member.email
  json.role member.primary_role
  json.status status(member)
end

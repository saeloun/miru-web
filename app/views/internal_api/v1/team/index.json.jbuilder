# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

def team_member_status(member)
  return unless current_user
    .has_any_role?({ name: :owner, resource: current_company }, { name: :admin, resource: current_company }) &&
    member.unconfirmed_email?

  I18n.t("team.reconfirmation")
end

def invited_user_status
  return unless current_user
    .has_any_role?({ name: :owner, resource: current_company }, { name: :admin, resource: current_company })

  I18n.t("team.invitation")
end

json.team teams do |company_user|
  member = company_user.user
  json.id member.id
  json.profile_picture user_avatar(member)
  json.first_name member.first_name
  json.last_name member.last_name
  json.name member.full_name
  json.email member.email
  json.role member.primary_role(current_company)
  json.status team_member_status(member)
  json.team_lead member.team_lead?
  if  member.department_id
    json.department do |department|
      json.id member.department_id
      json.name member.department_name
    end
  end
end

json.invitation invitations do |member|
  json.profile_picture image_url "avatar.svg"
  json.id member.id
  json.name member.full_name
  json.first_name member.first_name
  json.last_name member.last_name
  json.email member.recipient_email
  json.role member.role
  json.status invited_user_status
  json.team_lead false
end

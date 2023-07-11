# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.team teams do |team_member|
  json.extract! team_member, :id, :first_name, :last_name, :name, :email, :role, :status
  json.profile_picture user_avatar(team_member[:member])
end

json.invitation invitations do |member|
  json.extract! member, :id, :name, :first_name, :last_name, :email, :role, :status
  json.profile_picture image_url "avatar.svg"
end

json.pagination_details pagination_details

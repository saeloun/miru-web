# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.combined_details do
  json.array! combined_details do |item|
    if item[:data_type] == "Team"
      json.extract! item, :id, :first_name, :last_name, :name, :email, :role, :status, :is_team_member,
        :employment_type, :joined_at_date
      json.profile_picture user_avatar(item[:member])
    else
      json.extract! item, :id, :name, :first_name, :last_name, :email, :role, :status, :is_team_member
      json.profile_picture image_url "avatar.svg"
    end
  end
end

json.pagination_details pagination_details_combined

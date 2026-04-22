# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.combined_details do
  json.array! combined_details do |item|
    status_value = item[:status].to_s
    status_text = status_value == "pending" ? "invited" : status_value

    if item[:data_type] == "Team"
      json.extract! item, :id, :first_name, :last_name, :name, :email, :role, :is_team_member,
        :employment_type, :joined_at_date, :hours_logged, :billable_hours, :projects
      # Keep boolean `status` for compatibility while exposing canonical string via `statusText`.
      json.status status_value == "active"
      json.set! :statusText, status_text
      json.profile_picture user_avatar(item[:member])
    else
      json.extract! item, :id, :name, :first_name, :last_name, :email, :role, :is_team_member
      json.status status_value == "active"
      json.set! :statusText, status_text
      json.profile_picture image_url "avatar.svg"
    end
  end
end

json.pagination_details pagination_details_combined

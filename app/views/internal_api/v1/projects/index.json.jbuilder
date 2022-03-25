# frozen_string_literal: true

json.projects projects do |project|
  json.id project.id
  json.name project.name
  json.client do
    json.name project.client.name
  end
  json.isBillable project.billable
  json.minutesSpent project.total_hours_logged
end

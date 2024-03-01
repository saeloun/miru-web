# frozen_string_literal: true

json.clients clients do |client|
  json.partial! "internal_api/v1/partial/client", locals: { client: }
end

json.employees employees do |employee|
  json.id employee.id
  json.first_name employee.first_name
  json.last_name employee.last_name
end

json.entries do
  entries.each do |date, data|
    json.set! date do
      if data.is_a?(Array)
        json.array! data do |entry|
          if entry[:type] == "timesheet"
            json.partial! "internal_api/v1/partial/timesheet_entry", locals: { entry:, company: }
          else
            json.partial! "internal_api/v1/partial/timeoff_entry", locals: { entry:, company: }
          end
        end
      end
    end
  end
end

json.holiday_infos holiday_infos do |holiday_info|
  json.id holiday_info[:id]
  json.name holiday_info[:name]
  json.category holiday_info[:category]
  json.date CompanyDateFormattingService.new(holiday_info[:date], company:).process
  json.holiday_id holiday_info[:holiday_id]
end

json.leave_types leave_types do |leave_type|
  json.id leave_type[:id]
  json.name leave_type[:name]
  json.allocation_value leave_type[:allocation_value]
  json.allocation_period leave_type[:allocation_period]
  json.allocation_frequency leave_type[:allocation_frequency]
  json.carry_forward_days leave_type[:carry_forward_days]
  json.color leave_type[:color]
  json.icon leave_type[:icon]
  json.leave_id leave_type[:leave_id]
end

json.projects do
  projects.each do |client_name, data|
    json.set! client_name do
      json.array! data do |entry|
        json.id entry[:id]
        json.name entry[:name]
        json.billable entry[:billable]
        json.description entry[:description]
        json.client_id entry[:client_id]
      end
    end
  end
end

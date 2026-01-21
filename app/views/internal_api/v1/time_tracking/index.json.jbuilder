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
          json.id entry[:id]
          json.duration entry[:duration]
          json.note entry[:note]
          if entry[:type] == "timesheet"
            json.type entry[:type]
            json.work_date CompanyDateFormattingService.new(entry[:work_date], company:).process
            json.bill_status entry[:bill_status]
            json.client entry[:client]
            json.project entry[:project]
            json.project_id entry[:project_id]
            json.team_member entry[:team_member]
          else
            json.type "leave"
            json.leave_date CompanyDateFormattingService.new(entry[:leave_date], company:).process
            json.holiday_info_id entry[:holiday_info_id]
            json.leave_type_id entry[:leave_type_id]
            json.custom_leave_id entry[:custom_leave_id]
            json.user_id entry[:user_id]
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
  # Use composite id to avoid conflicts between LeaveType and CustomLeave
  if leave_type.is_a?(LeaveType)
    json.id leave_type[:id]
    json.type "leave_type"
    json.allocation_frequency leave_type[:allocation_frequency]
    json.carry_forward_days leave_type[:carry_forward_days]
    json.color leave_type[:color]
    json.icon leave_type[:icon]
  else
    # CustomLeave - prefix id to distinguish from LeaveType
    json.id "custom_#{leave_type[:id]}"
    json.custom_leave_id leave_type[:id]
    json.type "custom_leave"
    json.color "custom"
    json.icon "custom"
  end

  json.name leave_type[:name]
  json.allocation_value leave_type[:allocation_value]
  json.allocation_period leave_type[:allocation_period]
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

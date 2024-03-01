# frozen_string_literal: true

json.id entry[:id]
json.duration entry[:duration]
json.note entry[:note]
json.type "leave"
json.leave_date CompanyDateFormattingService.new(entry[:leave_date], company:).process
json.holiday_info_id entry[:holiday_info_id]
json.leave_type_id entry[:leave_type_id]
json.user_id entry[:user_id]

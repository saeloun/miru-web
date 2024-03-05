# frozen_string_literal: true

json.id entry[:id]
json.duration entry[:duration]
json.note entry[:note]
json.bill_status entry[:bill_status]
json.work_date CompanyDateFormattingService.new(entry[:work_date], company:).process
json.type entry[:type]
json.client entry[:client]
json.project entry[:project]
json.project_id entry[:project_id]
json.team_member entry[:team_member]

# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.array! meetings do |meeting|
  json.title meeting.summary
  json.start_date meeting.start.date_time
  json.duration FormatDuration.new(meeting.end.date_time.to_time - meeting.start.date_time.to_time).process
  json.description meeting.description || ""
end

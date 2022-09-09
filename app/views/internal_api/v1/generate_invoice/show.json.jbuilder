# frozen_string_literal: true

json.filter_options do
  json.team_members filter_options[:team_members] do |team_member|
   json.label team_member.full_name
   json.value team_member.id
  end
end

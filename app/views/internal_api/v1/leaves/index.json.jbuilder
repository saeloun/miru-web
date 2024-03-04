# frozen_string_literal: true

json.leaves leaves do |leave|
  json.leave_id leave.id
  json.year leave.year
  json.leave_types leave.leave_types.kept do |leave_type|
    json.id leave_type.id
    json.name leave_type.name
    json.icon leave_type.icon
    json.color leave_type.color
    json.allocation_value leave_type.allocation_value
    json.allocation_period leave_type.allocation_period
    json.allocation_frequency leave_type.allocation_frequency
    json.carry_forward_days leave_type.carry_forward_days
  end
end

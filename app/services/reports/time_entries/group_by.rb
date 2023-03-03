# frozen_string_literal: true

class Reports::TimeEntries::GroupBy
  attr_reader :group_by_field

  POSSIBLE_GROUP_BY_INPUTS = ["team_member", "client", "project"].freeze

  def initialize(group_by)
    @group_by_field = group_by
  end

  def is_valid_group_by
    !group_by_field.blank? && POSSIBLE_GROUP_BY_INPUTS.include?(group_by_field)
  end
end

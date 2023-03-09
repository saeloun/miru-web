# frozen_string_literal: true

class Reports::TimeEntries::Result < ApplicationService
  attr_reader :es_response, :group_by

  GROUP_BY_INPUT_TO_GROUP_LABEL_FIELD = {
    "team_member" => :user_name,
    "client" => :client_name,
    "project" => :project_name
  }

  def initialize(es_response, group_by)
    @es_response = es_response
    @group_by = group_by
  end

  def process
    if Reports::TimeEntries::GroupBy.new(group_by).is_valid_group_by
      process_response_by_group_by
    else
      [{ label: "", entries: es_response }]
    end
  end

  private

    def process_response_by_group_by
      grouped_data = es_response.group_by(&GROUP_BY_INPUT_TO_GROUP_LABEL_FIELD[group_by]).sort
      grouped_data.map do | label, entries |
        { label:, entries: }
      end
    end
end

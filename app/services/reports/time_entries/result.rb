# frozen_string_literal: true

class Reports::TimeEntries::Result < ApplicationService
  attr_reader :es_response, :group_by

  GROUP_BY_INPUT_TO_GROUP_LABEL_FIELD = {
    "team_member" => :user_name,
    "client" => :client_name,
    "project" => :project_name
  }

  GROUP_BY_INPUT_TO_GROUP_ID_FIELD = {
    "team_member" => :user_id,
    "client" => :client_id,
    "project" => :project_id
  }

  def initialize(es_response, group_by)
    @es_response = es_response
    @group_by = group_by
  end

  def process
    if Reports::TimeEntries::GroupBy.new(group_by).valid_group_by?
      process_response_by_group_by
    else
      [{ label: "", entries: es_response.to_a }]
    end
  end

  private

    def process_response_by_group_by
      label_field = GROUP_BY_INPUT_TO_GROUP_LABEL_FIELD[group_by.to_s]
      id_field = GROUP_BY_INPUT_TO_GROUP_ID_FIELD[group_by.to_s]

      grouped_data = es_response.group_by { |entry| entry[label_field] }.map do |label, entries|
      id = entries.first[id_field]

      {
        label:,
        id:,
        entries:
      }
    end

      grouped_data.sort_by { |group| group[:label] } # Optionally sort groups by label
    end
end

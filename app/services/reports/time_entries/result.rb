# frozen_string_literal: true

class Reports::TimeEntries::Result < ApplicationService
  attr_reader :es_response, :group_by

  GROUP_BY_INPUT_TO_ES_FIELD = {
    "team_member" => :user_id,
    "client" => :client_id,
    "project" => :project_id
  }

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
      # client_logo = fetch_client_logo(es_response.first)
      [{ label: "", entries: es_response }]
    end
  end

  private

    def process_response_by_group_by
      grouped_data = es_response.group_by(&GROUP_BY_INPUT_TO_ES_FIELD[group_by])
      grouped_data.map do | user_id, entries |
        { label: entries.first[GROUP_BY_INPUT_TO_GROUP_LABEL_FIELD[group_by]], entries: }
      end
    end

    def fetch_client_logo(timesheet_entry)
      timesheet_entry.project.client.logo_url
    end
end

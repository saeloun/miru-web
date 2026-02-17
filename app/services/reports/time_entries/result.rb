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
      GROUP_BY_INPUT_TO_GROUP_LABEL_FIELD[group_by.to_s]
      GROUP_BY_INPUT_TO_GROUP_ID_FIELD[group_by.to_s]

      grouped_data = es_response.group_by { |entry|
        # Get the label based on group_by field
        case group_by.to_s
        when "client"
          entry.try(:client_name) || entry[:client_name] || ""
        when "project"
          entry.try(:project_name) || entry[:project_name] || ""
        when "team_member"
          entry.try(:user_name) || entry[:user_name] || ""
        else
          ""
        end
      }.map do |label, entries|
        # Get the ID from the first entry based on group_by field
        id = case group_by.to_s
             when "client"
               entries.first.try(:client_id) || entries.first[:client_id]
             when "project"
               entries.first.try(:project_id) || entries.first[:project_id]
             when "team_member"
               entries.first.try(:user_id) || entries.first[:user_id]
             else
               nil
        end

        {
          label: label || "",
          id:,
          entries:
        }
      end

      grouped_data.sort_by { |group| group[:label].to_s } # Sort groups by label
    end
end

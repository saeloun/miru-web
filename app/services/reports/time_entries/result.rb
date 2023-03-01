# frozen_string_literal: true

module Reports::TimeEntries
  class Result < ApplicationService
    attr_reader :es_response, :group_by

    def initialize(es_response, group_by)
      @es_response = es_response
      @group_by = group_by
    end

    def process
      if group_by.blank?
        [{ label: "", entries: es_response }]
      else
        process_response_by_group_by
      end
    end

    def process_response_by_group_by
      public_send("group_by_#{group_by}")
    end

    def group_by_team_member
      grouped_data = es_response.group_by(&:user_id)
      grouped_data.map do | user_id, entries |
        { label: entries.first.user.full_name, entries: }
      end
    end

    def group_label(timesheet_entry, bucket_name)
      case group_by
      when "team_member"
        timesheet_entry.user.full_name
      when "client"
        timesheet_entry.project.client.name
      when "project"
        timesheet_entry.project.name
      when "week"
        start_date = DateTime.parse(bucket_name)
        end_date = start_date + 6.days
        date_format = "%d %b %Y"
        "#{start_date.strftime(date_format)} - #{end_date.strftime(date_format)}"
      end
    end
  end
end

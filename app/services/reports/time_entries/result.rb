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
        process_aggregated_es_response
      end
    end

    private

      # When we query ES, we get all matching timesheet entries as response even when we pass aggregation query.
      # Those timesheet entries contains all required association but not the ones in aggregated data.
      # So, in order to avoid queries for associated records,
      # creating map of id -> timesheet entries from the general ES response and
      # then using it for building final data by merging that with ids found in aggregation query.
      def process_aggregated_es_response
        id_to_timesheet_entry = timsheet_id_to_timesheet_entry
        buckets = es_response.aggs["grouped_reports"]["buckets"]

        report_result = buckets.filter_map do |bucket|
          timesheet_entry_ids = bucket["top_report_hits"]["hits"]["hits"].pluck("_id")
          timesheet_entries = id_to_timesheet_entry.slice(*timesheet_entry_ids).values

          if timesheet_entries.empty?
            nil
          else
            {
              label: group_label(timesheet_entries.first, bucket["key_as_string"]),
              entries: timesheet_entries
            }
          end
        end

        report_result.sort_by! { |report| report[:label] } unless group_by == "week"

        report_result
      end

      def timsheet_id_to_timesheet_entry
        es_response.reduce({}) do |res, timesheet|
          res.merge({ timesheet.id.to_s => timesheet })
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

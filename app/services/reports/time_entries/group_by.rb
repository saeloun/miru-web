# frozen_string_literal: true

module Reports::TimeEntries
  class GroupBy < ApplicationService
    attr_reader :group_by_field

    POSSIBLE_GROUP_BY_INPUTS = ["team_member", "client", "project", "week"].freeze
    GROUP_BY_INPUT_TO_ES_FIELD = {
      "team_member" => "user_id",
      "client" => "client_id",
      "project" => "project_id",
      "week" => "week"
    }

    def initialize(group_by_field)
      @group_by_field = group_by_field
    end

    def process
      return {} if group_by_field.blank? || POSSIBLE_GROUP_BY_INPUTS.exclude?(group_by_field)

      group_by_query(GROUP_BY_INPUT_TO_ES_FIELD[group_by_field])
    end

    def group_by_query(field)
      {
        aggs: {
          grouped_reports: group_by_term(field).merge(
            {
              aggs: {
                top_report_hits: {
                  top_hits: {
                    sort: [{ work_date: { order: "desc" } }],
                    _source: ["id"],
                    size: 100 # aggregation query can only return max top 100 hits
                  }
                }
              }
            })
        }
      }
    end

    def group_by_term(field)
      if field == "week"
        { date_histogram: { field: "work_date", calendar_interval: "week" } }
      else
        { terms: { field: } }
      end
    end
  end
end

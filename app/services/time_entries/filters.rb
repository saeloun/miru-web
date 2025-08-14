# frozen_string_literal: true

module TimeEntries
  class Filters < ApplicationService
    FILTER_PARAM_LIST = %i[date_range status team_member client]

    attr_reader :filter_params

    def initialize(filter_params)
      @filter_params = filter_params
    end

    def process
      FILTER_PARAM_LIST.reduce({}) do |where_condition, filter_param_key|
        if filter_params[filter_param_key].present?
          filter_result = public_send("#{filter_param_key}_filter")
          # Special handling for project_id to intersect rather than overwrite
          if filter_result.key?(:project_id) && where_condition.key?(:project_id)
            existing_ids = Array(where_condition[:project_id])
            new_ids = Array(filter_result[:project_id])
            where_condition[:project_id] = existing_ids & new_ids
          else
            where_condition.merge!(filter_result)
          end
          where_condition.merge!(active_time_entries)
        else
          where_condition.merge!(active_time_entries)
        end
        where_condition
      end
    end

    def date_range_filter
      {
        work_date: DateRangeService.new(
          timeframe: filter_params[:date_range], from: filter_params[:from],
          to: filter_params[:to]).process
      }
    end

    def status_filter
      { bill_status: filter_params[:status] }
    end

    def client_filter
      # TimesheetEntry doesn't have client_id, need to filter through projects
      client_ids = Array(filter_params[:client])
      project_ids = Project.where(client_id: client_ids).pluck(:id)
      { project_id: project_ids }
    end

    def team_member_filter
      { user_id: filter_params[:team_member] }
    end

    def active_time_entries
      { discarded_at: nil }
    end
  end
end

# frozen_string_literal: true

module TimeEntryReport
  class Filters < ApplicationService
    include UtilityFunctions

    FILTER_PARAM_LIST = %i[date_range status team_member client]

    attr_reader :filter_params

    def initialize(filter_params)
      @filter_params = filter_params
    end

    def process
      FILTER_PARAM_LIST.reduce({}) do |where_condition, filter_param_key|
        if filter_params[filter_param_key].present?
          where_condition.merge(public_send("#{filter_param_key}_filter"))
        else
          where_condition
        end
      end
    end

    def date_range_filter
      { work_date: range_from_timeframe(filter_params[:date_range]) }
    end

    def status_filter
      { bill_status: filter_params[:status] }
    end

    def client_filter
      { client_id: filter_params[:client] }
    end

    def team_member_filter
      { user_id: filter_params[:team_member] }
    end
  end
end

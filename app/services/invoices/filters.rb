# frozen_string_literal: true

module Invoices
  class Filters < ApplicationService
    FILTER_PARAM_LIST = %i[date_range status client]

    attr_reader :filter_params

    def initialize(filter_params)
      @filter_params = filter_params
     end

    def process
      FILTER_PARAM_LIST.reduce({}) do |condition, filter_param_key|
        if filter_params[filter_param_key].present?
          condition.merge(public_send("#{filter_param_key}_filter"))
        else
          condition
        end
      end
    end

    def client_filter
      { client_id: filter_params[:client] }
    end

    def date_range_filter
      {
        issue_date: DateRangeService.new(
          timeframe: filter_params[:date_range], from: filter_params[:from_date_range],
          to: filter_params[:to_date_range]).process
      }
    end

    def status_filter
      { status: filter_params[:status] }
    end
  end
end

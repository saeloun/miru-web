# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render json: { entries: }, status: :ok
  end

  private

    def entries
      current_company.timesheet_entries.map do |timesheet_entry|
        timesheet_entry.formatted_entry.transform_keys { |key| key.to_s.camelize(:lower) }
      end
    end
end

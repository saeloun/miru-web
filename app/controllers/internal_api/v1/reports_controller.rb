# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render json: { entries: }, status: :ok
  end

  private

    def entries
      current_company.timesheet_entries.includes([:user, :project])
        .within_date_range(from_date, to_date)
        .with_client(clients)
        .with_bill_status(params[:status])
        .with_user_id(params[:team_member])
        .map do |timesheet_entry|
        timesheet_entry.formatted_entry.transform_keys { |key| key.to_s.camelize(:lower) }
      end
    end

    def from_date
      case params[:date_range]
      when "this_month"
        0.month.ago.beginning_of_month
      when "last_month"
        1.month.ago.beginning_of_month
      when "this_week"
        0.weeks.ago.beginning_of_week
      when "last_week"
        1.weeks.ago.beginning_of_week
      end
    end

    def to_date
      case params[:date_range]
      when "this_month"
        0.month.ago.end_of_month
      when "last_month"
        1.month.ago.end_of_month
      when "this_week"
        0.weeks.ago.end_of_week
      when "last_week"
        1.weeks.ago.end_of_week
      end
    end

    def clients
      Client.where(id: params[:client_id]) if params[:client_id].present?
    end
end

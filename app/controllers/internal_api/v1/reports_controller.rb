# frozen_string_literal: true

class InternalApi::V1::ReportsController < InternalApi::V1::ApplicationController
  include Timesheet

  def index
    authorize :report
    render :index, locals: { entries: }, status: :ok
  end

  private

    def entries
      where_clause = add_filters_if_any({ project_id: current_company.project_ids })
      TimesheetEntry.search(where: where_clause, includes: [:user, :project])
    end

    def add_filters_if_any(where_clause)
      where_clause = add_date_range_filter(where_clause)
      where_clause = add_clients_filter(where_clause)
      where_clause = add_bill_status_filter(where_clause)
      where_clause = add_team_members_filter(where_clause)
    end

    def add_date_range_filter(where_clause)
      if params[:date_range].present?
        where_clause.merge(work_date: from_date..to_date)
      else
        where_clause
      end
    end

    def add_clients_filter(where_clause)
      if params[:client_id].present?
        clients = Client.includes(:projects).where(id: params[:client_id])
        project_ids = clients.map { |client| client.project_ids }.flatten
        where_clause.merge(project_id: project_ids)
      else
        where_clause
      end
    end

    def add_bill_status_filter(where_clause)
      if params[:status].present?
        where_clause.merge(bill_status: params[:status])
      else
        where_clause
      end
    end

    def add_team_members_filter(where_clause)
      if params[:team_member].present?
        where_clause.merge(user_id: params[:team_member])
      else
        where_clause
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
end

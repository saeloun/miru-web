# frozen_string_literal: true

module Report
  class Filters < ApplicationService
    def initialize(params)
      @date_range_filter = params[:date_range]
      @status_filter = params[:status]
      @team_members_filter = params[:team_member]
      @client_filter = params[:client_id]
    end

    def process
      where_clause = add_date_range_filter_if_any({})
      where_clause = add_clients_filter_if_any(where_clause)
      where_clause = add_bill_status_filter_if_any(where_clause)
      where_clause = add_team_members_filter_if_any(where_clause)
    end

    private

      attr_reader :date_range_filter, :status_filter, :client_filter, :team_members_filter

      def add_date_range_filter_if_any(where_clause)
        return where_clause if date_range_filter.blank?

        where_clause.merge(work_date: from_date..to_date)
      end

      def add_clients_filter_if_any(where_clause)
        return where_clause if client_filter.blank?

        clients = Client.includes(:projects).where(id: client_filter.split(","))
        project_ids = clients.map { |client| client.project_ids }.flatten
        where_clause.merge(project_id: project_ids)
      end

      def add_bill_status_filter_if_any(where_clause)
        return where_clause if status_filter.blank?

        where_clause.merge(bill_status: status_filter.split(","))
      end

      def add_team_members_filter_if_any(where_clause)
        return where_clause if team_members_filter.blank?

        where_clause.merge(user_id: team_members_filter.split(","))
      end

      def from_date
        case date_range_filter
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
        case date_range_filter
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
end

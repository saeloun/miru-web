# frozen_string_literal: true

module Clients
  class IndexService < ApplicationService
    attr_reader :current_company, :current_user, :query, :time_frame

    def initialize(current_company, current_user, query, time_frame)
      @current_company = current_company
      @current_user = current_user
      @query = query
      @time_frame = time_frame
    end

    def process
      clients = clients_list.to_a

      {
        client_details: client_details(clients),
        total_minutes: total_minutes(clients),
        overdue_outstanding_amount: overdue_outstanding_amount(clients)
      }
    end

    private

      def clients_list
        base_clients = user_can_see_all_clients? ? current_company.clients.kept : user_assigned_clients

        clients = if query.present?
          search_clients(search_term, where_clause)
        else
          base_clients
        end

        clients.includes(:addresses, :invoices, logo_attachment: :blob)
      end

      def user_assigned_clients
        Client.kept
          .joins(projects: :project_members)
          .where(company_id: current_company.id)
          .where(project_members: { user_id: current_user.id, discarded_at: nil })
          .distinct
      end

      def search_term
        @_search_term = query.presence || "*"
      end

      def where_clause
        if user_can_see_all_clients?
          { company_id: current_company.id, discarded_at: nil }
        else
          { id: user_assigned_clients.pluck(:id) }
        end
      end

      def user_can_see_all_clients?
        current_user.has_role?(:owner, current_company) ||
          current_user.has_role?(:admin, current_company) ||
          current_user.has_role?(:book_keeper, current_company)
      end

      def search_clients(term, where_query)
        Client.search(
          term,
          fields: [:name, :email],
          match: :word_middle,
          where: where_query
        )
      end

      def client_details(clients)
        minutes_by_client = total_minutes_by_client(clients)

        clients.map do |client|
          client.client_detail(time_frame, minutes_spent: minutes_by_client.fetch(client.id, 0))
        end
      end

      def total_minutes(clients)
        total_minutes_by_client(clients).values.sum
      end

      def overdue_outstanding_amount(clients)
        invoice_totals = invoice_totals_by_client(clients)
        outstanding = invoice_totals.values.sum { |amounts| amounts[:outstanding_amount] }
        overdue = invoice_totals.values.sum { |amounts| amounts[:overdue_amount] }

        {
          outstanding: outstanding.round(2),
          overdue: overdue.round(2),
          currency: current_company.base_currency
        }
      end

      def total_minutes_by_client(clients)
        client_ids = clients.map(&:id)
        return {} if client_ids.empty?

        TimesheetEntry.kept
          .joins(project: :client)
          .where(projects: { client_id: client_ids })
          .where(work_date: DateRangeService.new(timeframe: time_frame).process)
          .group("projects.client_id")
          .sum(:duration)
      end

      def invoice_totals_by_client(clients)
        client_ids = clients.map(&:id)
        return {} if client_ids.empty?

        full_amount_sql = InvoiceAmountsSummary::FULL_AMOUNT_SQL
        overdue_status = Invoice.statuses.fetch("overdue")
        unpaid_statuses = InvoiceAmountsSummary::UNPAID_STATUSES.map do |status|
          Invoice.statuses.fetch(status)
        end.join(", ")

        current_company.invoices.kept
          .where(client_id: client_ids)
          .group(:client_id)
          .pluck(
            :client_id,
            Arel.sql("SUM(CASE WHEN status = #{overdue_status} THEN #{full_amount_sql} ELSE 0 END)"),
            Arel.sql("SUM(CASE WHEN status IN (#{unpaid_statuses}) THEN #{full_amount_sql} ELSE 0 END)")
          )
          .each_with_object({}) do |(client_id, overdue_amount, outstanding_amount), totals|
            totals[client_id] = {
              overdue_amount: overdue_amount.to_f.round(2),
              outstanding_amount: outstanding_amount.to_f.round(2)
            }
          end
      end
  end
end

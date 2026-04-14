# frozen_string_literal: true

module Reports::AccountsAging
  class FetchOverdueAmount < ApplicationService
    attr_reader :current_company, :params

    def initialize(current_company, params = {})
      @current_company = current_company
      @params = params
    end

    def process
      grouped_amounts = grouped_amounts_by_client

      {
        clients: fetch_client_details(grouped_amounts),
        total_amount_overdue_by_date_range: grouped_amounts.delete(:total),
        base_currency: current_company.base_currency,
        filter_options: {
          clients: all_billable_clients.map { |client| { id: client.id, name: client.name } }
        }
      }
    end

    private

      def as_of_date
        @as_of_date ||= begin
          value = params[:as_of_date]
          value.present? ? Date.parse(value.to_s) : Date.current
        rescue ArgumentError
          Date.current
        end
      end

      def selected_client_ids
        @selected_client_ids ||= params[:client_ids].to_s.split(",").map(&:strip).reject(&:blank?).map(&:to_i)
      end

      def fetch_client_details(grouped_amounts)
        clients.map do |client|
          {
            id: client.id,
            name: client.name,
            logo: client.logo_url,
            amount_overdue: grouped_amounts.fetch(client.id, empty_bucket)
          }
        end.sort_by { |client| -client.dig(:amount_overdue, :total).to_f }
      end

      def outstanding_invoices
        Invoice.where(client_id: clients.unscope(:select, :order).select(:id))
          .where("amount_due > 0")
          .where(status: [:sent, :viewed, :paid, :overdue])
      end

      def grouped_amounts_by_client
        rows.each_with_object(Hash.new { |hash, key| hash[key] = empty_bucket.dup }) do |row, totals|
          totals[row.client_id] = {
            zero_to_thirty_days: row.zero_to_thirty_days.to_f,
            thirty_one_to_sixty_days: row.thirty_one_to_sixty_days.to_f,
            sixty_one_to_ninety_days: row.sixty_one_to_ninety_days.to_f,
            ninety_plus_days: row.ninety_plus_days.to_f,
            total: row.total.to_f
          }
        end.tap do |totals|
          totals[:total] = totals.values.reduce(empty_bucket.dup) do |aggregate, bucket|
            aggregate.merge(
              zero_to_thirty_days: aggregate[:zero_to_thirty_days] + bucket[:zero_to_thirty_days],
              thirty_one_to_sixty_days: aggregate[:thirty_one_to_sixty_days] + bucket[:thirty_one_to_sixty_days],
              sixty_one_to_ninety_days: aggregate[:sixty_one_to_ninety_days] + bucket[:sixty_one_to_ninety_days],
              ninety_plus_days: aggregate[:ninety_plus_days] + bucket[:ninety_plus_days],
              total: aggregate[:total] + bucket[:total]
            )
          end
        end
      end

      def clients
        @_clients ||= begin
          scope = all_billable_clients

          selected_client_ids.present? ? scope.where(id: selected_client_ids) : scope
        end
      end

      def all_billable_clients
        @_all_billable_clients ||= current_company.clients
          .kept
          .with_attached_logo
          .joins(:projects)
          .where(projects: { billable: true })
          .select("clients.*")
          .distinct
          .order("clients.name ASC")
      end

      def rows
        today = as_of_date
        zero_to_thirty_start = today - 30.days
        thirty_one_to_sixty_start = today - 60.days
        sixty_one_to_ninety_start = today - 90.days
        amount_sql = <<~SQL.squish
          CASE
            WHEN COALESCE(base_currency_amount, 0) > 0 THEN
              ROUND(
                base_currency_amount * CASE WHEN amount = 0 THEN 1.0 ELSE amount_due / amount END,
                2
              )
            ELSE ROUND(amount_due, 2)
          END
        SQL

        outstanding_invoices
          .group(:client_id)
          .select(
            :client_id,
            "SUM(CASE WHEN due_date >= #{ActiveRecord::Base.connection.quote(zero_to_thirty_start)} AND due_date <= #{ActiveRecord::Base.connection.quote(today)} THEN #{amount_sql} ELSE 0 END) AS zero_to_thirty_days",
            "SUM(CASE WHEN due_date >= #{ActiveRecord::Base.connection.quote(thirty_one_to_sixty_start)} AND due_date < #{ActiveRecord::Base.connection.quote(zero_to_thirty_start)} THEN #{amount_sql} ELSE 0 END) AS thirty_one_to_sixty_days",
            "SUM(CASE WHEN due_date >= #{ActiveRecord::Base.connection.quote(sixty_one_to_ninety_start)} AND due_date < #{ActiveRecord::Base.connection.quote(thirty_one_to_sixty_start)} THEN #{amount_sql} ELSE 0 END) AS sixty_one_to_ninety_days",
            "SUM(CASE WHEN due_date < #{ActiveRecord::Base.connection.quote(sixty_one_to_ninety_start)} THEN #{amount_sql} ELSE 0 END) AS ninety_plus_days",
            "SUM(#{amount_sql}) AS total"
          )
      end

      def empty_bucket
        {
          zero_to_thirty_days: 0.0,
          thirty_one_to_sixty_days: 0.0,
          sixty_one_to_ninety_days: 0.0,
          ninety_plus_days: 0.0,
          total: 0.0
        }
      end
  end
end

# frozen_string_literal: true

module Reports::AccountsAging
  class FetchOverdueAmount < ApplicationService
    attr_reader :current_company

    def initialize(current_company)
      @current_company = current_company
    end

    def process
      grouped_amounts = grouped_amounts_by_client

      {
        clients: fetch_client_details(grouped_amounts),
        total_amount_overdue_by_date_range: grouped_amounts.delete(:total),
        base_currency: current_company.base_currency
      }
    end

    private

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
        Invoice.where(client: clients)
          .where("amount_due > 0")
          .where(status: [:sent, :viewed, :paid, :overdue])
      end

      def grouped_amounts_by_client
        outstanding_invoices.each_with_object(Hash.new { |hash, key| hash[key] = empty_bucket.dup }) do |invoice, totals|
          amount = amount_due_in_base_currency(invoice)
          bucket = bucket_key(invoice.due_date)

          totals[invoice.client_id][bucket] += amount
          totals[invoice.client_id][:total] += amount
          totals[:total][bucket] += amount
          totals[:total][:total] += amount
        end
      end

      def clients
        @_clients ||= current_company.clients.joins(:projects).where(
          projects: { billable: true }
        ).kept.order(name: :asc).uniq
      end

      def amount_due_in_base_currency(invoice)
        return invoice.amount_due.to_f.round(2) unless invoice.base_currency_amount.to_f.positive?

        proportion = invoice.amount.to_f.zero? ? 1.0 : invoice.amount_due.to_f / invoice.amount.to_f
        (invoice.base_currency_amount * proportion).round(2)
      end

      def bucket_key(due_date)
        today = Date.current

        case due_date
        when 30.days.ago..today
          :zero_to_thirty_days
        when 60.days.ago...30.days.ago
          :thirty_one_to_sixty_days
        when 90.days.ago...60.days.ago
          :sixty_one_to_ninety_days
        else
          :ninety_plus_days
        end
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

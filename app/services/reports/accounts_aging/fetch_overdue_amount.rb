# frozen_string_literal: true

module Reports::AccountsAging
  class FetchOverdueAmount < ApplicationService
    attr_reader :current_company

    def initialize(current_company)
      @current_company = current_company
    end

    def process
      {
        clients: fetch_client_details,
        total_amount_overdue_by_date_range: amount_overdue_by_date_range(overdue_invoices_for_all_clients),
        base_currency: current_company.base_currency
      }
    end

    private

      def fetch_client_details
        clients.map do |client|
          {
            id: client.id,
            name: client.name,
            logo: client.logo_url,
            amount_overdue: amount_overdue_by_date_range(client.invoices)
          }
        end
      end

      def overdue_invoices_for_all_clients
        Invoice.overdue.for_clients(clients)
      end

      def amount_overdue_by_date_range(invoices)
        {
          zero_to_thirty_days: total_amount_due_during(invoices, ((1.month.ago)...(1.day.from_now))),
          thirty_one_to_sixty_days: total_amount_due_during(invoices, ((2.month.ago)...1.month.ago)),
          sixty_one_to_ninety_days: total_amount_due_during(invoices, ((3.month.ago)...2.month.ago)),
          ninety_plus_days: total_amount_due_during(invoices, (10.year.ago...3.month.ago)),
          total: calculate_total_overdue_in_base_currency(invoices.overdue)
        }
      end

      def total_amount_due_during (invoices, duration)
        overdue_invoices = invoices.overdue.where(due_date: duration)
        calculate_total_overdue_in_base_currency(overdue_invoices)
      end

      def calculate_total_overdue_in_base_currency(invoices)
        invoices.sum do |invoice|
          # Calculate the outstanding amount in base currency
          if invoice.base_currency_amount.to_f > 0
            # Calculate the proportion of amount_due to original amount
            proportion = invoice.amount_due.to_f / invoice.amount.to_f rescue 1.0
            (invoice.base_currency_amount * proportion).round(2)
          else
            invoice.amount_due
          end
        end
      end

      def clients
        @_clients ||= current_company.clients.joins(:projects).where(
          projects: { billable: true }
        ).kept.order(name: :asc).uniq
      end
  end
end

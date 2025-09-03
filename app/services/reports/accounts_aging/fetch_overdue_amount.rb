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
          client_outstanding_invoices = outstanding_invoices_for_clients([client])
          {
            id: client.id,
            name: client.name,
            logo: client.logo_url,
            amount_overdue: amount_overdue_by_date_range(client_outstanding_invoices)
          }
        end
      end

      def overdue_invoices_for_all_clients
        outstanding_invoices_for_clients(clients)
      end

      def outstanding_invoices_for_clients(clients)
        # Get all invoices that have outstanding amounts and should be tracked for aging
        # Include sent, viewed, paid (partially), overdue invoices - basically any invoice that's been issued
        Invoice.where(client: clients)
          .where("amount_due > 0")
          .where(status: [:sent, :viewed, :paid, :overdue])
      end

      def amount_overdue_by_date_range(invoices)
        today = Date.current
        {
          zero_to_thirty_days: total_amount_due_during(invoices, (30.days.ago..today)),
          thirty_one_to_sixty_days: total_amount_due_during(invoices, (60.days.ago...30.days.ago)),
          sixty_one_to_ninety_days: total_amount_due_during(invoices, (90.days.ago...60.days.ago)),
          ninety_plus_days: total_amount_due_during(invoices, (10.years.ago...90.days.ago)),
          total: calculate_total_overdue_in_base_currency(invoices)
        }
      end

      def total_amount_due_during(invoices, duration)
        # Filter invoices by due date within the duration
        overdue_invoices = invoices.where(due_date: duration)
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

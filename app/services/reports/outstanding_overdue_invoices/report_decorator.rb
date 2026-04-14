# frozen_string_literal: true

class Reports::OutstandingOverdueInvoices::ReportDecorator < ApplicationService
  attr_reader :current_company

  def initialize(current_company)
    @current_company = current_company
  end

  def process
    {
      invoices: loaded_invoices,
      summary: summary,
      clients: clients_data,
      clients_data: clients_data,  # For compatibility with specs
      current_company: current_company,
      company: current_company  # For compatibility with specs
    }
  end

  private

    def outstanding_overdue_statuses
      ["overdue", "sent", "viewed"]
    end

    def invoices
      @invoices ||= current_company.invoices.kept
        .where(status: outstanding_overdue_statuses)
        .includes(:company, client: { logo_attachment: :blob })
        .order(issue_date: :desc)
    end

    def loaded_invoices
      @loaded_invoices ||= invoices.to_a
    end

    def invoice_groups
      @invoice_groups ||= loaded_invoices.group_by(&:client)
    end

    def summary
      @summary ||= loaded_invoices.each_with_object({
        total_outstanding_amount: 0,
        total_overdue_amount: 0,
        total_invoice_amount: 0,
        currency: current_company.base_currency
      }) do |invoice, totals|
        amount_due = invoice_amount_due_in_base_currency(invoice)

        totals[:total_invoice_amount] += amount_due
        if invoice.status == "overdue"
          totals[:total_overdue_amount] += amount_due
        else
          totals[:total_outstanding_amount] += amount_due
        end
      end
    end

    def clients_data
      invoice_groups.map do |client, client_invoices|
        client_invoices.each_with_object(
          {
            name: client.name,
            client: client,
            logo: client.logo_url,
            invoices: client_invoices,
            total_outstanding_amount: 0,
            total_outstanding: 0,
            total_overdue_amount: 0,
            total_overdue: 0
          }
        ) do |invoice, totals|
          amount_due = invoice_amount_due_in_base_currency(invoice)

          if invoice.status == "overdue"
            totals[:total_overdue_amount] += amount_due
            totals[:total_overdue] += amount_due
          else
            totals[:total_outstanding_amount] += amount_due
            totals[:total_outstanding] += amount_due
          end
        end
      end.sort_by { |c| -(c[:total_outstanding_amount].to_f + c[:total_overdue_amount].to_f) }
    end

    def invoice_amount_due_in_base_currency(invoice)
      # Use amount_due for unpaid portion
      amount_due = invoice.amount_due || invoice.amount

      # Apply currency conversion if needed
      if invoice.base_currency_amount.to_f > 0.00 && invoice.amount.to_f > 0.00
        # Calculate the ratio of amount_due to full amount, then apply to base currency
        ratio = amount_due.to_f / invoice.amount.to_f
        ratio * invoice.base_currency_amount
      else
        amount_due
      end
    end
end

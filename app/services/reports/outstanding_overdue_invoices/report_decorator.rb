# frozen_string_literal: true

class Reports::OutstandingOverdueInvoices::ReportDecorator < ApplicationService
  attr_reader :current_company

  def initialize(current_company)
    @current_company = current_company
  end

  def process
    {
      invoices: invoices,
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
        .includes(:client, :company)
        .order(issue_date: :desc)
    end

    def summary
      {
        total_outstanding_amount: calculate_sum_in_base_currency(invoices.where(status: ["sent", "viewed"])),
        total_overdue_amount: calculate_sum_in_base_currency(invoices.where(status: "overdue")),
        total_invoice_amount: calculate_sum_in_base_currency(invoices),
        currency: current_company.base_currency
      }
    end

    def clients_data
      invoices.group_by(&:client).map do |client, client_invoices|
        {
          name: client.name,
          client: client,  # For compatibility with specs
          logo: client.logo_url,
          invoices: client_invoices,
          total_outstanding_amount: calculate_outstanding(client_invoices),
          total_outstanding: calculate_outstanding(client_invoices),  # For compatibility with specs
          total_overdue_amount: calculate_overdue(client_invoices),
          total_overdue: calculate_overdue(client_invoices)  # For compatibility with specs
        }
      end.sort_by { |c| c[:name] }
    end

    def calculate_outstanding(client_invoices)
      client_invoices
        .select { |i| ["sent", "viewed"].include?(i.status) }
        .sum { |invoice| invoice_amount_in_base_currency(invoice) }
    end

    def calculate_overdue(client_invoices)
      client_invoices
        .select { |i| i.status == "overdue" }
        .sum { |invoice| invoice_amount_in_base_currency(invoice) }
    end

    def calculate_sum_in_base_currency(invoices)
      invoices.sum { |invoice| invoice_amount_in_base_currency(invoice) }
    end

    def invoice_amount_in_base_currency(invoice)
      # Use base_currency_amount if available and greater than 0, otherwise use amount
      if invoice.base_currency_amount.to_f > 0.00
        invoice.base_currency_amount
      else
        invoice.amount
      end
    end
end

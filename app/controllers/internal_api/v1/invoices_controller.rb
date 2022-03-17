# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize :invoice
    render json: { invoices: invoices }.deep_transform_keys { |k| k.to_s.camelize(:lower) }, status: :ok
  end

  private
    def invoices
      current_company.invoices.map do |invoice|
        {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          amount: invoice.amount,
          client: {
            name: client(invoice.client_id).name
          },
          company: {
            name: current_company.name,
            base_currency: current_company.base_currency,
            date_format: current_company.date_format || "YYYY-MM-DD",
          },
          status: invoice.status
        }
      end
    end

    def client(id)
      Client.find(id)
    end
end

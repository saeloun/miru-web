# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize :invoice
    pagy, invoices = pagy(current_company.invoices
      .from_date(params[:from])
      .to_date(params[:to])
      .for_clients(params[:client_ids])
      .with_statuses(params[:statuses]),
    items_param: :invoices_per_page)

    render json: {
      invoices: invoices.map do |invoice|
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
      end,
      pagy: pagy_metadata(pagy) }.deep_transform_keys { |k| k.to_s.camelize(:lower)
      }, status: :ok
  end

  private
    def client(id)
      Client.find(id)
    end
end

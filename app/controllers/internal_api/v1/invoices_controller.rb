# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  def index
    authorize Invoice
    pagy, invoices = pagy(
      current_company.invoices.includes(:client)
            .from_date(params[:from])
            .to_date(params[:to])
            .for_clients(params[:client_ids])
            .with_statuses(params[:statuses]),
      items_param: :invoices_per_page)

    render :index, locals: {
      invoices:,
      pagy: pagy_metadata(pagy),
      summary: {
        overdue_amount: current_company.invoices.overdue.sum(:amount),
        outstanding_amount: current_company.invoices.sum(:outstanding_amount),
        draft_amount: current_company.invoices.draft.sum(:amount)
      }
    }
  end

  def create
    authorize Invoice
    render :create, locals: {
      invoice: Invoice.create!(invoice_params),
      client: Client.find(invoice_params[:client_id])
    }
  end

  def update
    authorize invoice
    if invoice.update!(invoice_params)
      render :update, locals: {
        invoice:,
        client: Client.find(invoice[:client_id])
      }
    end
  end

  private

    def invoice
      @_invoice ||= Invoice.find(params[:id])
    end

    def invoice_params
      params.require(:invoice).permit(
        policy(Invoice).permitted_attributes
      )
    end
end

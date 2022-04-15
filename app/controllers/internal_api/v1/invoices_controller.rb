# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  before_action :load_client, only: [:create, :update]

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
      invoice: @client.invoices.create!(invoice_params),
      client: @client
    }
  end

  def update
    authorize invoice
    invoice = @client.invoices.find(params[:id])
    invoice.update!(invoice_params)
    render :update, locals: {
      invoice:,
      client: @client
    }
  end

  private

    def load_client
      client = invoice_params[:client_id] || invoice[:client_id]
      @client = Client.find(client)
    end

    def invoice
      @_invoice ||= Invoice.find(params[:id])
    end

    def invoice_params
      params.require(:invoice).permit(
        policy(Invoice).permitted_attributes
      )
    end
end

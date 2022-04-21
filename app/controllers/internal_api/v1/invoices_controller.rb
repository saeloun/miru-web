# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  before_action :load_client, only: [:create, :update]
  after_action :ensure_time_entries_billed, only: [:send_invoice]

  def index
    authorize Invoice
    pagy, invoices = pagy(
      current_company.invoices.includes(:client)
            .from_date(params[:from])
            .to_date(params[:to])
            .for_clients(params[:client_ids])
            .with_statuses(params[:statuses])
            .order(created_at: :desc),
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

  def send_invoice
    authorize invoice

    invoice.send_to_email(
      subject: invoice_email_params[:subject],
      message: invoice_email_params[:message],
      recipients: invoice_email_params[:recipients]
    )

    render json: { message: "Invoice will be sent!" }, status: :accepted
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

    def invoice_email_params
      params.require(:invoice_email).permit(:subject, :message, recipients: [])
    end

    def ensure_time_entries_billed
      invoice.update_timesheet_entry_status!
    end
end

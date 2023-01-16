# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  before_action :load_client, only: [:create, :update]
  after_action :ensure_time_entries_billed, only: [:send_invoice]

  def index
    authorize Invoice
    data = Invoices::IndexService.new(params, current_company).process

    render :index, locals: {
      invoices: data[:invoices_query],
      pagination_details: data[:pagination_details],
      recently_updated_invoices: data[:recently_updated_invoices],
      summary: data[:summary]
    }
  end

  def create
    authorize Invoice
    render :create, locals: {
      invoice: current_company.invoices.create!(invoice_params),
      client: @client
    }
  end

  def edit
    authorize invoice
    render :edit, locals: {
      invoice:,
      client: invoice.client,
      client_list: current_company.client_list
    }
  end

  def update
    authorize invoice
    invoice.update!(invoice_params)
    render :update, locals: {
      invoice:,
      client: @client
    }
  end

  def show
    authorize invoice
    render :show, locals: {
      invoice:,
      client: invoice.client
    }
  end

  def destroy
    authorize invoice
    invoice.discard!
  end

  def send_invoice
    authorize invoice

    invoice.sending! unless invoice.paid?
    invoice.send_to_email(
      subject: invoice_email_params[:subject],
      message: invoice_email_params[:message],
      recipients: invoice_email_params[:recipients]
    )

    render json: { message: "Invoice will be sent!" }, status: :accepted
  end

  def download
    authorize invoice

    send_data InvoicePayment::PdfGeneration.process(invoice, current_company.company_logo, root_url)
  end

  private

    def load_client
      client = invoice_params[:client_id] || invoice[:client_id]
      @client = Client.find(client)
    end

    def invoice
      @_invoice ||= Invoice.includes(:client, :invoice_line_items).find(params[:id])
    end

    def invoice_params
      params.require(:invoice).permit(policy(Invoice).permitted_attributes)
    end

    def invoice_email_params
      params.require(:invoice_email).permit(:subject, :message, recipients: [])
    end

    def ensure_time_entries_billed
      invoice.update_timesheet_entry_status!
    end
end

# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  before_action :load_client, only: [:create, :update]
  after_action :track_event, only: [:create, :update, :destroy, :send_invoice, :download]

  def index
    authorize Invoice
    data = Invoices::IndexService.new(params, current_company).process
    render :index, locals: {
      invoices: data[:invoices],
      pagination_details: data[:pagination_details],
      recently_updated_invoices: data[:recently_updated_invoices],
      summary: data[:summary]
    }
  end

  def create
    authorize Invoice
    @invoice = current_company.invoices.create!(invoice_params)
    render :create, locals: {
      invoice: @invoice,
      client: @client,
      client_member_emails: @invoice.client.send_invoice_emails(@virtual_verified_invitations_allowed)
    }
  end

  def edit
    authorize invoice
    render :edit, locals: {
      invoice:,
      client: invoice.client,
      client_list: current_company.clients.kept,
      client_member_emails: invoice.client.send_invoice_emails(@virtual_verified_invitations_allowed)
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
      client: invoice.client,
      client_member_emails: invoice.client.send_invoice_emails(@virtual_verified_invitations_allowed)
    }
  end

  def destroy
    authorize invoice
    invoice.discard!
  end

  def send_invoice
    authorize invoice

    unless invoice.recently_sent_mail?
      return render json: { message: "Invoice was sent just a minute ago." }, status: :accepted
    end

    recipients = invoice_email_params[:recipients]

    if recipients.size < 6
      invoice.sending! unless invoice.paid? || invoice.overdue?
      invoice.send_to_email(
        subject: invoice_email_params[:subject],
        message: invoice_email_params[:message],
        recipients: invoice_email_params[:recipients],
        current_user_id: current_user.id
      )

      render json: { message: "Invoice will be sent!" }, status: :accepted
    else
      render json: { errors: "Email can only be sent to 5 recipients." }, status: :unprocessable_entity
    end
  end

  def send_reminder
    authorize invoice

    if invoice.overdue?
      SendReminderMailer.with(
        invoice:,
        subject: invoice_email_params[:subject],
        recipients: invoice_email_params[:recipients],
        message: invoice_email_params[:message]
      ).send_reminder.deliver_later

      render json: { message: "A reminder has been sent" }, status: :accepted
    end
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
      @_invoice ||= Invoice.kept.includes(
        :client,
        { invoice_line_items: :timesheet_entry },
        { company: { logo_attachment: :blob } }
         )
        .find(params[:id])
    end

    def invoice_params
      params.require(:invoice).permit(policy(Invoice).permitted_attributes)
    end

    def invoice_email_params
      params.require(:invoice_email).permit(:subject, :message, recipients: [])
    end

    def track_event
      Invoices::EventTrackerService.new(params[:action], @invoice || invoice, params).process
    end
end

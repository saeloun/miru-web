# frozen_string_literal: true

class Api::V1::InvoicesController < Api::V1::ApplicationController
  before_action :load_client, only: [:create, :update]
  after_action :track_event, only: [:create, :update, :destroy, :send_invoice, :download]

  def index
    authorize Invoice
    response = Invoices::IndexService.process(current_company, params)

    render :index, locals: {
      invoices: response[:invoices],
      pagination_details: response[:pagination_details],
      summary: response[:summary],
      recently_updated_invoices: response[:recently_updated_invoices],
      recently_updated_total_count: response[:recently_updated_total_count],
      meta: financial_api_meta(currency: response.dig(:summary, :currency))
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

    # Validate parameters
    recipients = invoice_email_params[:recipients] || []
    # Filter out blank entries
    recipients = recipients.reject(&:blank?)

    if recipients.empty?
      return render json: { error: I18n.t("invoices_controller.send_invoice.recipients_required") }, status: 422
    end

    # Check recipient limit
    if recipients.size > 5
      return render json: { error: I18n.t("invoices_controller.send_invoice.recipient_limit") }, status: 422
    end

    # Don't send if already paid
    if invoice.paid?
      return render json: { error: I18n.t("invoices_controller.send_invoice.already_paid") }, status: 422
    end

    # Generate PDF
    begin
      pdf_data = InvoicePayment::PdfGeneration.process(invoice, current_company.company_logo, root_url)
    rescue StandardError => e
      Rails.logger.error "Failed to generate PDF: #{e.message}"
      return render json: { error: I18n.t("invoices_controller.send_invoice.pdf_failed") }, status: 500
    end

    # Send email with PDF attachment
    # Encode PDF data as base64 to avoid encoding issues in job queue
    InvoiceMailer.with(
      invoice: invoice,
      pdf_data: Base64.strict_encode64(pdf_data),
      pdf_encoded: true,
      subject: invoice_email_params[:subject],
      recipients: recipients,
      message: invoice_email_params[:message]
    ).send_invoice.deliver_later

    # Update invoice status and sent_at in a single query
    attrs = {}
    attrs[:status] = "sent" if invoice.draft?
    attrs[:sent_at] = Time.current if invoice.sent_at.nil?
    invoice.update!(attrs) if attrs.any?

    render json: { message: I18n.t("invoices_controller.send_invoice.success") }, status: 200
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

      render json: { message: I18n.t("invoices_controller.send_reminder.success") }, status: 202
    else
      render json: { error: I18n.t("invoices_controller.send_reminder.overdue_only") }, status: 422
    end
  end

  def razorpay_payment_link
    authorize invoice

    return render json: { error: "Invoice is already paid" }, status: 422 if invoice.paid?
    return render json: { error: "Razorpay payments are available only for INR invoices" }, status: 422 unless invoice.currency == "INR"
    return render json: { error: "Razorpay is not enabled for invoices" }, status: 422 unless razorpay_provider
    return render json: { error: "SMS payment links are not enabled for this workspace" }, status: 422 if notify_sms? && !razorpay_sms_available?
    return render json: { error: "Client phone is required to send SMS payment links" }, status: 422 if notify_sms? && invoice.client.phone.blank?

    service = PaymentProviders::RazorpayPaymentLinkService.new(
      invoice:,
      provider: razorpay_provider,
      callback_url: razorpay_success_invoice_payments_url(invoice),
      notify_sms: notify_sms?
    )
    payment_link_url = service.process

    render json: {
      message: service.sms_sent? ? "Razorpay payment link sent by SMS" : "Razorpay payment link ready",
      payment_link_url:,
      sms_sent: service.sms_sent?
    }, status: service.sms_sent? ? 202 : 200
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn("Razorpay payment link failed for invoice #{invoice.id}: #{error.message}")
    render json: { error: error.message.presence || "Unable to create Razorpay payment link" }, status: 422
  end

  def download
    authorize invoice

    pdf_data = InvoicePayment::PdfGeneration.process(invoice, current_company.company_logo, root_url)
    send_data pdf_data,
              type: "application/pdf",
              disposition: "attachment",
              filename: "#{invoice.invoice_number}.pdf"
  rescue Pundit::NotAuthorizedError
    raise # Re-raise authorization errors
  rescue StandardError => e
    Rails.logger.error "Failed to generate PDF for invoice #{invoice.id}: #{e.message}"
    render json: { error: I18n.t("invoices_controller.download.pdf_failed") }, status: 500
  end

  private

    def load_client
      client = invoice_params[:client_id] || invoice[:client_id]
      @client = current_company.clients.find(client)
    end

    def invoice
      @_invoice ||= current_company.invoices.kept.includes(
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

    def razorpay_provider
      return @_razorpay_provider if instance_variable_defined?(:@_razorpay_provider)

      provider = current_company.payments_providers.find_by(
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true
      )

      @_razorpay_provider =
        if provider&.enabled_on_invoices? && provider.razorpay_configured?
          provider
        end
    end

    def notify_sms?
      ActiveModel::Type::Boolean.new.cast(params[:notify_sms]) == true
    end

    def razorpay_sms_available?
      current_company.country == "IN" && current_company.pro_access? && razorpay_provider&.sms_notifications_enabled?
    end

    def track_event
      Invoices::EventTrackerService.new(params[:action], @invoice || invoice, params).process
    end
end

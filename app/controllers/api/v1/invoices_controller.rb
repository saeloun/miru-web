# frozen_string_literal: true

class Api::V1::InvoicesController < Api::V1::ApplicationController
  before_action :load_client, only: [:create, :update]
  after_action :track_event, only: [:create, :update, :destroy, :send_invoice, :download]

  def index
    authorize Invoice

    # Build query
    invoices = current_company.invoices.kept

    # Apply search if present (support both query and search_term params)
    search_query = params[:query] || params[:search_term]
    if search_query.present?
      invoices = invoices.search(search_query)
    elsif params[:q].present?
      # Handle legacy ransack-style params
      if params[:q][:client_id_eq].present?
        invoices = invoices.where(client_id: params[:q][:client_id_eq])
      end
      if params[:q][:status_eq].present?
        invoices = invoices.where(status: params[:q][:status_eq])
      end
      if params[:q][:invoice_number_cont].present?
        invoices = invoices.where("invoice_number ILIKE ?", "%#{params[:q][:invoice_number_cont]}%")
      end
    end

    # Apply filters
    # Status filter - support both status and statuses params
    if params[:status].present?
      invoices = invoices.where(status: params[:status])
    elsif params[:statuses].present?
      invoices = invoices.where(status: params[:statuses])
    end

    # Date range filter
    if params[:date_range].present?
      date_range = DateRangeService.new(
        timeframe: params[:date_range],
        from: params[:from_date_range],
        to: params[:to_date_range]
      ).process
      invoices = invoices.where(issue_date: date_range)
    end

    # Handle client filtering - support client_id, client, and client_ids array parameters
    if params[:client_id].present?
      invoices = invoices.where(client_id: params[:client_id])
    elsif params[:client].present?
      client_ids = Array(params[:client])
      invoices = invoices.where(client_id: client_ids) unless client_ids.empty?
    elsif params[:client_ids].present?
      client_ids = Array(params[:client_ids])
      invoices = invoices.where(client_id: client_ids) unless client_ids.empty?
    end

    # Pagination with Pagy
    page = (params[:page] || 1).to_i
    page = 1 if page <= 0
    per_page = (params[:invoices_per_page] || params[:per] || 10).to_i
    per_page = 10 if per_page <= 0  # Use default instead of all records when per_page is 0

    # Use Pagy for pagination with overflow handling
    begin
      pagy_metadata, paginated_invoices = pagy(invoices, items: per_page, page: page, overflow: :empty_page)
    rescue Pagy::OverflowError
      # Handle page overflow by returning empty result
      pagy_metadata, paginated_invoices = pagy(invoices.none, items: per_page, page: 1)
    end

    # Calculate summary with proper amounts
    all_invoices = current_company.invoices.kept

    # For draft invoices, sum the total amount
    draft_amount = all_invoices.draft.sum { |invoice|
      invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount.to_f : invoice.amount.to_f
    }.round(2)

    # For outstanding, use the outstanding_amount or amount_due field
    # Outstanding includes sent, viewed, and overdue statuses
    outstanding_amount = all_invoices.where(status: [:sent, :viewed, :overdue]).sum { |invoice|
      # Use outstanding_amount if available, otherwise use amount_due, fallback to amount
      if invoice.outstanding_amount.to_f > 0
        invoice.outstanding_amount.to_f
      elsif invoice.amount_due.to_f > 0
        invoice.amount_due.to_f
      else
        invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount.to_f : invoice.amount.to_f
      end
    }.round(2)

    # For overdue, only get overdue invoices
    overdue_amount = all_invoices.overdue.sum { |invoice|
      if invoice.outstanding_amount.to_f > 0
        invoice.outstanding_amount.to_f
      elsif invoice.amount_due.to_f > 0
        invoice.amount_due.to_f
      else
        invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount.to_f : invoice.amount.to_f
      end
    }.round(2)

    # Calculate total amount for ALL status
    total_amount = (draft_amount + outstanding_amount + overdue_amount).round(2)

    summary = {
      draftAmount: draft_amount == 0 ? 0 : draft_amount.to_s,
      outstandingAmount: outstanding_amount == 0 ? 0 : outstanding_amount.to_s,
      overdueAmount: overdue_amount == 0 ? 0 : overdue_amount.to_s,
      totalAmount: total_amount == 0 ? 0 : total_amount.to_s,
      currency: current_company.base_currency
    }

    render :index, locals: {
      invoices: paginated_invoices,
      pagination_details: {
        page: pagy_metadata.page,
        pages: pagy_metadata.pages,
        total: pagy_metadata.count
      },
      summary: summary
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
      return render json: { message: "Invoice was sent just a minute ago." }, status: 202
    end

    recipients = invoice_email_params[:recipients]

    if recipients.size < 6
      invoice.sending! unless invoice.paid? || invoice.overdue?
      invoice.send_to_email(
        subject: invoice_email_params[:subject],
        message: invoice_email_params[:message],
        recipients: invoice_email_params[:recipients]
      )

      render json: { message: "Invoice will be sent!" }, status: 202
    else
      render json: { errors: "Email can only be sent to 5 recipients." }, status: 422
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

      render json: { message: "A reminder has been sent" }, status: 202
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

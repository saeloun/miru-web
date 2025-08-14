# frozen_string_literal: true

class InternalApi::V1::InvoicesController < InternalApi::V1::ApplicationController
  before_action :load_client, only: [:create, :update]
  after_action :track_event, only: [:create, :update, :destroy, :send_invoice, :download]

  def index
    authorize Invoice

    # Build query with ransack
    @q = current_company.invoices.kept.ransack(params[:q])

    # Apply search if present (support both query and search_term params)
    search_query = params[:query] || params[:search_term]
    invoices = if search_query.present?
      current_company.invoices.kept.search(search_query)
    else
      @q.result
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

    # Handle client filtering - support both client_id and client array parameters
    if params[:client_id].present?
      invoices = invoices.where(client_id: params[:client_id])
    elsif params[:client].present?
      client_ids = Array(params[:client])
      invoices = invoices.where(client_id: client_ids) unless client_ids.empty?
    end

    # Pagination
    page = (params[:page] || 1).to_i
    page = 1 if page <= 0
    per_page = (params[:invoices_per_page] || params[:per] || 10).to_i
    per_page = invoices.count if per_page <= 0
    invoices = invoices.page(page).per(per_page)

    # Calculate summary
    # For summary, include base_currency_amount calculation like the old service
    status_amounts = current_company.invoices.kept.group_by(&:status).transform_values { |inv_list|
      inv_list.sum { |invoice|
        invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
      }
    }
    status_amounts.default = 0

    summary = {
      draftAmount: status_amounts["draft"],
      outstandingAmount: status_amounts["sent"] + status_amounts["viewed"] + status_amounts["overdue"],
      overdueAmount: status_amounts["overdue"],
      currency: current_company.base_currency
    }

    # Get recently updated
    recently_updated = current_company.invoices.kept.order(updated_at: :desc).limit(10)

    render :index, locals: {
      invoices: invoices,
      pagination_details: {
        page: invoices.current_page,
        pages: invoices.total_pages,
        total: invoices.total_count
      },
      recently_updated_invoices: recently_updated,
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

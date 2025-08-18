# frozen_string_literal: true

class Api::V1::ClientsController < Api::V1::ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized
  def index
    authorize Client

    # Use ransack for search
    @q = current_company.clients.kept.ransack(params[:q])

    # Apply text search if query present
    clients = if params[:query].present?
      current_company.clients.kept.search(params[:query])
    else
      @q.result
    end

    clients = clients.includes(:logo_attachment)

    # Calculate aggregations
    client_details = clients.map { |client| client.client_detail(params[:time_frame]) }
    total_minutes = client_details.pluck(:minutes_spent).sum
    overdue_outstanding_amount = current_company.overdue_and_outstanding_and_draft_amount

    render json: {
      client_details: client_details,
      total_minutes: total_minutes,
      overdue_outstanding_amount: overdue_outstanding_amount
    }, status: 200
  end

  def create
    authorize Client
    client = current_company.clients.create!(client_params)

    render json: {
      client: serialize_client(client),
      address: client.current_address
    }, status: 201
  end

  def add_client_contact
    authorize client
    invitation_service = Invitations::ClientInvitationService.new(
      params,
      current_company,
      current_user,
      client
    )

    invitation_service.process
    render json: { notice: "Invitation sent successfully." }, status: 200
  end

  def show
    authorize client

    render json: {
      client_details: Client::ShowPresenter.new(client).process,
      client_member_emails: client.send_invoice_emails(@virtual_verified_invitations_allowed),
      project_details: client.project_details(params[:time_frame]),
      total_minutes: client.total_hours_logged(params[:time_frame]),
      overdue_outstanding_amount: client.client_overdue_and_outstanding_calculation,
      invoices: client.invoices.includes([:company]).map { |invoice| serialize_invoice(invoice) }
    }, status: 200
  end

  def update
    authorize client
    ActiveRecord::Base.transaction do
      client.update!(update_client_params)
      if params[:client][:prev_email] && update_client_params[:email]
        prev_user = User.find_by!(email: params[:client][:prev_email])
        new_user = User.find_by!(email: update_client_params[:email])
        client_member = ClientMember.find_by!(client:, user: prev_user)
        client_member.update!(user: new_user)
      end
      render json: {
        success: true,
        client:,
        notice: I18n.t("client.update.success.message")
      }, status: 200
    end
  end

  def destroy
    authorize client

    if client.discard!
      render json: {
        client:,
        notice: I18n.t("client.delete.success.message")
      }, status: 200
    end
  end

  def send_payment_reminder
    authorize client

    SendPaymentReminderMailer.with(
      recipients: client_email_params[:email_params][:recipients],
      selected_invoices: client_email_params[:selected_invoices],
      message: client_email_params[:email_params][:message],
      subject: client_email_params[:email_params][:subject],
    ).send_payment_reminder.deliver_later

    render json: { notice: "Payment reminder has been sent" }, status: 202
  end

  private

    def client
      @_client ||= Client.find(params[:id])
    end

    def client_params
      params.require(:client).permit(
        policy(Client).permitted_attributes
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end

    def update_client_params
      if client_params.key?(:logo) && client_params[:logo].blank?
        client.logo.destroy
        client_params.except(:logo)
      else
        client_params
      end
    end

    def client_email_params
      params.require(:client_email).permit(email_params: [:subject, :message, recipients: []], selected_invoices: [])
    end

    def serialize_client(client)
      {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.current_address,
        logo_url: client.logo_url
      }
    end

    def serialize_invoice(invoice)
      {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        status: invoice.status,
        due_date: invoice.due_date,
        issue_date: invoice.issue_date
      }
    end

    def current_company
      return if current_user.nil?

      @_current_company ||= current_user.current_workspace
    end
end

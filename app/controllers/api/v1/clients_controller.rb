# frozen_string_literal: true

class Api::V1::ClientsController < Api::V1::ApplicationController
  def index
    authorize Client
    response = Clients::IndexService.process(
      current_company,
      current_user,
      params[:query] || params.dig(:q, :name_cont),
      params[:time_frame]
    )

    render json: {
      client_details: response[:client_details],
      total_minutes: response[:total_minutes],
      overdue_outstanding_amount: response[:overdue_outstanding_amount]
    }, status: 200
  end

  def create
    authorize Client
    client = Client.create!(client_params)
    render :create, locals: { client:, address: client.current_address }, status: 201
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
    render json: { notice: I18n.t("clients.add_client_contact.success") }, status: 200
  end

  def show
    authorize client

    render locals: {
             client_details: Client::ShowPresenter.new(client).process,
             client_member_emails: client.send_invoice_emails(@virtual_verified_invitations_allowed),
             project_details: client.project_details(params[:time_frame]),
             total_minutes: client.total_hours_logged(params[:time_frame]),
             overdue_outstanding_amount: client.client_overdue_and_outstanding_calculation,
             invoices: client.invoices.includes([:company])
           },
      status: 200
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

    render json: { notice: I18n.t("clients.send_payment_reminder.success") }, status: 202
  end

  private

    def client
      @_client ||= current_company.clients.find(params[:id])
    end

    def client_params
      params.require(:client).permit(
        policy(Client).permitted_attributes
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end

    def update_client_params
      logo_value = client_params[:logo]
      if client_params.key?(:logo) && (logo_value.blank? || logo_value == "null")
        client.logo.purge if client.logo.attached?
        client_params.except(:logo)
      else
        client_params
      end
    end

    def client_email_params
      params.require(:client_email).permit(email_params: [:subject, :message, recipients: []], selected_invoices: [])
    end
end

# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def index
    authorize Client
    data = Clients::IndexService.new(current_company, params[:query], params[:time_frame]).process
    render json: data, status: :ok
  end

  def create
    authorize Client
    client = Client.create!(client_params)
    render :create, locals: { client:, address: client.current_address }
  end

  def add_client_contact
    authorize client
    invitation_service = Invitations::ClientInvitationService.new(
      params,
      current_company,
      current_user,
      client
    )

    invitations = invitation_service.process
    render json: { notice: "Invitation sent successfully." }, status: :ok
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
      status: :ok
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
      }, status: :ok
    end
  end

  def destroy
    authorize client

    if client.discard!
      render json: {
        client:,
        notice: I18n.t("client.delete.success.message")
      }, status: :ok
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

    render json: { notice: "Payment reminder has been sent" }, status: :accepted
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
end

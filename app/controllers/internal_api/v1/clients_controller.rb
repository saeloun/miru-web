# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def index
    authorize Client
    query = current_company.clients.kept.ransack({ name_or_email_cont: params[:q] })
    clients = query.result(distinct: true)
    client_details = clients.map { |client| client.client_detail(params[:time_frame]) }
    total_minutes = (client_details.map { |client| client[:minutes_spent] }).sum
    overdue_outstanding_amount = current_company.overdue_and_outstanding_and_draft_amount
    users_with_client_role = current_company.users.joins(:roles).where(roles: { name: "client" })
    users_not_in_client_members = users_with_client_role.where.not(id: ClientMember.pluck(:user_id))
    render json: {
             client_details:, total_minutes:, overdue_outstanding_amount:,
             users_not_in_client_members:
           },
      status: :ok
  end

  def create
    authorize Client
    ActiveRecord::Base.transaction do
      client = Client.create!(client_params)
      user = User.find_by!(email: params[:client][:email])
      client_member = ClientMember.create!(client:, user:)
      render :create, locals: { client:, address: client.current_address }
    end
  end

  def show
    authorize client

    render json: {
             client_details: Client::ShowPresenter.new(client).process,
             project_details: client.project_details(params[:time_frame]),
             total_minutes: client.total_hours_logged(params[:time_frame]),
             overdue_outstanding_amount: client.client_overdue_and_outstanding_calculation
           },
      status: :ok
  end

  def update
    authorize client
    ActiveRecord::Base.transaction do
      client.update!(update_client_params)
      if update_client_params[:email]
        user = User.find_by!(email: update_client_params[:email])
        client_member = ClientMember.find_by!(client:)
        client_member.update!(user:)
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
end

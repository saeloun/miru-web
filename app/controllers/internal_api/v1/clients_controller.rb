# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  before_action :is_user_admin_or_owner?, only: [:update]

  def update
    unless current_company.id == client.company_id
      return render json: {
        message: I18n.t("client.update.failure.unauthorized")
      }, status: :forbidden
    end

    if client.update(client_params)
      render json: { success: true, client: client, notice: I18n.t("client.update.success.message") }, status: :ok
    else
      render json: { errors: client.errors, notice: I18n.t("client.update.failure.message") }, status: :unprocessable_entity
    end
  end

  private
    def client
      @_client ||= Client.find(params[:id])
    end

    def client_params
      params.require(:client).permit(
        :name, :email, :phone, :address
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end

    def is_user_admin_or_owner?
      render json: {
        message: I18n.t("errors.unauthorized")
      }, status: :forbidden unless current_user.has_any_role?(:owner, :admin)
    end
end

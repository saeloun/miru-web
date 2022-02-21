# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  before_action :is_user_admin_or_owner?, :is_user_authorized?, only: [:update, :destroy]

  def update
    if client.update(client_params)
      render json: {
        success: true,
        client: client,
        notice: I18n.t("client.update.success.message")
      }, status: :ok
    else
      render json: {
        errors: client.errors,
        notice: I18n.t("client.update.failure.message")
      }, status: :unprocessable_entity
    end
  end

  def destroy
    if client.discard
      render json: {
        client: client,
        notice: I18n.t("client.delete.success.message")
      }, status: :ok
    else
      render json: {
        notice: I18n.t("errors.internal_server_error")
      }, status: :internal_server_error
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

    def is_user_authorized?
      unless current_company.id == client.company_id
        render json: {
          message: I18n.t("client.update.failure.unauthorized")
        }, status: :forbidden
      end
    end

    def is_user_admin_or_owner?
      render json: {
        message: I18n.t("errors.unauthorized")
      }, status: :forbidden unless current_user.has_any_role?(:owner, :admin)
    end
end

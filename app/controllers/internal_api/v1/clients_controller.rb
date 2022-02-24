# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def update
    authorize client
    unless current_company.id == client.company_id
      return render json: {
        message: I18n.t("client.update.failure.unauthorized")
      }, status: :forbidden
    end

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
end

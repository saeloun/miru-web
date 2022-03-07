# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized

  def show
    current_client = client || default_client
    hours_logged = current_client.hours_logged(params[:from], params[:to])
    render json: { success: true, client: client, hours_logged: hours_logged }
  end

  def update
    authorize client

    if client.update!(client_params)
      render json: {
        success: true,
        client: client,
        notice: I18n.t("client.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize client

    if client.discard!
      render json: {
        client: client,
        notice: I18n.t("client.delete.success.message")
      }, status: :ok
    end
  end

  private
    def client
      @_client ||= Client.find(params[:id])
    end

    def default_client
      @_default_client ||= Client.first
    end

    def client_params
      params.require(:client).permit(
        policy(Client).permitted_attributes
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end
end

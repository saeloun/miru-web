# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def index
    authorize Client
    client_hours = current_user.current_workspace.client_hours_logged(params[:time_frame])
    total_hour = 0
    client_hours.each do |a|
      temp_hour = a[:hours_spend]
      total_hour += temp_hour
    end
    total_hour
    render json: { success: true, client_hours: client_hours, total_hour: total_hour }
  end

  def show
    authorize client
    hours_logged = client.hours_logged(params[:time_frame])
    client_details = { id: client.id, name: client.name, email: client.email }
    total_hour = 0
    hours_logged.each do |a|
      temp_hour = a[:hour_spend]
      total_hour += temp_hour
    end
    total_hour
    render json: { success: true, client: client_details, hours_logged: hours_logged, total_hour: total_hour }
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

    def client_params
      params.require(:client).permit(
        policy(Client).permitted_attributes
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end
end

# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def index
    authorize Client
    client_hours = current_user.current_workspace.client_hours_logged(params[:time_frame])
    total_hours = (client_hours.map { |client| client[:hours_spend] }).sum
    render json: { client_hours: client_hours, total_hours: total_hours }, status: :ok
  end

  def show
    authorize client
    project_details = client.hours_logged(params[:time_frame])
    client_details = { id: client.id, name: client.name, email: client.email }
    total_hours = (project_details.map { |project| project["hour_spend"] }).sum
    render json: { client: client_details, project_details: project_details, total_hours: total_hours }, status: :ok
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

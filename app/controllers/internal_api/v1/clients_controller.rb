# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def update
    current_client = Client.find_by(id: params[:id])

    if current_client.nil?
      return render json: { message: "Client not found" }, status: :not_found
    end

    unless current_company.id == current_client.company_id
      return render json: {
        message: "User is unauthorized to modify this client's details"
      }, status: :forbidden
    end

    if current_client.update(client_params)
      render json: { success: true, client: current_client }
    else
      render json: current_client.errors, status: :unprocessable_entity
    end
  end

  private
    def client_params
      params.require(:client).permit(
        :name, :email, :phone, :address
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end
end

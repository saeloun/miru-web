# frozen_string_literal: true

class InternalApi::V1::PurgeClientLogoController < InternalApi::V1::ApplicationController
  def destroy
    client = Client.find(params[:client_id])
    authorize client, :purge_logo?
    client.client_logo.destroy
    render json: { notice: "Client logo has been removed" }, status: :ok
  end
end

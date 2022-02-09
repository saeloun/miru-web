# frozen_string_literal: true

class ClientsController < ApplicationController
  def index
    clients
  end

  def create
    client = Client.new(client_params)
    client.company_id = current_company.id
    if client.save
      redirect_to clients_path
    else
      render :index, client: client, status: :unprocessable_entity
      flash.now[:error] = "Client creation failed"
    end
  end

  private
    def clients
      @_clients ||= current_company.clients
    end
    def client_params
      params.require(:client).permit(:name, :email, :phone, :address, :country, :timezone)
    end
end

# frozen_string_literal: true

class ClientsController < ApplicationController
  def index
    @clients = current_company.clients
  end

  def create
    @client = Client.new(client_params)
    @client.company_id = current_company.id
    if @client.save
      redirect_to clients_path
    else
      render :index, status: :unprocessable_entity
      flash.now[:error] = "Client creation failed"
    end
  end

  private
    def client_params
      params.require(:client).permit(:name, :email, :phone, :address, :country, :timezone)
    end
end

# frozen_string_literal: true

class ClientsController < ApplicationController
  def index
    render :index, locals: { clients: clients, new_client: client, keep_new_client_dialog_open: false }
  end

  def create
    client = Client.new(client_params)
    client.company_id = current_company.id
    if client.save
      redirect_to clients_path
    else
      flash.now[:error] = "Client creation failed"
      render :index, locals: { clients: clients, new_client: client, keep_new_client_dialog_open: true }, status: :unprocessable_entity
    end
  end

  private
    def clients
      @_clients ||= current_company.clients
    end

    def client
      @_client ||= Client.new
    end

    def client_params
      params.require(:client).permit(:name, :email, :phone, :address, :country, :timezone)
    end
end

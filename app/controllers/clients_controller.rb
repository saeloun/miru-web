# frozen_string_literal: true

class ClientsController < ApplicationController
  skip_after_action :verify_authorized, except: :create

  def index
    render :index, locals: {
      clients: clients,
      new_client: Client.new,
      keep_new_client_dialog_open: false
    }
  end

  def create
    client = Client.new(client_params)
    authorize client
    if client.save
      redirect_to clients_path, notice: t("client.create.success")
    else
      flash.now[:error] = t("client.create.failure")
      render :index, locals: {
        clients: clients,
        new_client: client,
        keep_new_client_dialog_open: true
      }, status: :unprocessable_entity
    end
  end

  private
    def clients
      @_clients ||= current_company.clients.kept.order(created_at: :desc).map do |c|
        c.attributes.merge({ hours_logged: c.timesheet_entries.sum(:duration) })
      end
    end

    def client_params
      params.require(:client).permit(
        policy(Client).permitted_attributes
      ).tap do |client_params|
        client_params[:company_id] = current_company.id
      end
    end
end

# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def index
    @clients = Client.all
    render action_name, locals: { clients: @clients }
  end
end

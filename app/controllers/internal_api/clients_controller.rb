# frozen_string_literal: true

class InternalApi::ClientsController < ApplicationController
  def index
    @clients = Client.all
    render action_name, locals: { clients: @clients }
  end
end

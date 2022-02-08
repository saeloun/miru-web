# frozen_string_literal: true

class ClientsController < ApplicationController
  def index
    @clients = current_company.clients
  end
end

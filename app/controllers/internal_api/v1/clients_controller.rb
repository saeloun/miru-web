# frozen_string_literal: true

class InternalApi::V1::ClientsController < InternalApi::V1::ApplicationController
  def index
    render action_name, locals: { clients: clients }
  end

  private
    def clients
      @_clients ||= Client.where(company: current_user.company)
    end
end

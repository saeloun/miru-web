# frozen_string_literal: true

class Api::V1::Cli::ClientsController < Api::V1::Cli::BaseController
  def index
    authorize Client

    clients = ClientPolicy::Scope.new(current_user, current_company).resolve
    if params[:query].present?
      search_term = ActiveRecord::Base.sanitize_sql_like(params[:query].to_s)
      clients = clients.reorder(nil).where(
        "clients.name ILIKE :query OR clients.email ILIKE :query",
        query: "%#{search_term}%"
      )
    end

    render json: {
      clients: clients.map do |client|
        {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          currency: client.currency
        }
      end
    }, status: 200
  end
end

# frozen_string_literal: true

class InternalApi::V1::Projects::SearchAllController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    projects = []
    search_term = search_params.downcase.strip
    search_term = search_term.gsub(/\s+/, "%")
    search_term = "%#{search_term}%"
    projects += current_company.projects.where("lower(projects.name) LIKE ?", search_term)
    projects += current_company.clients.where("lower(clients.name) LIKE ?", search_term)
    # projects += current_company.users.where("lower(concat(users.first_name, " ", users.last_name))  LIKE ?", search_term).projects
    render json: { projects: }
  end

  private

    def search_params
      params.require(:search_term)
    end

    def get_data_from_users
      users = current_company.users.where(
        "lower(concat(users.first_name, " ", users.last_name)) LIKE ?",
        "%#{search_term}%")
    end
end

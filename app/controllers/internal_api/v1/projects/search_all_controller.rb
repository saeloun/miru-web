# frozen_string_literal: true

class InternalApi::V1::Projects::SearchAllController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    search_term = search_params.downcase.strip
    search_term = search_term.gsub(/\s+/, "%")
    search_term = "#{search_term}%"
    projects = User.joins(
      "JOIN project_members ON users.id = project_members.user_id
      JOIN projects ON projects.id = project_members.project_id
      JOIN clients ON projects.client_id = clients.id"
    ).where(
      "projects.discarded_at IS NULL
      AND clients.company_id = ?
      AND (
      lower(projects.name) LIKE ?
      OR lower(clients.name) LIKE ?
      OR lower(concat(users.first_name, ' ', users.last_name)) LIKE ?
      )", current_company.id, search_term, search_term, search_term
    ).select("DISTINCT projects.id, projects.name, clients.name AS client_name")
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

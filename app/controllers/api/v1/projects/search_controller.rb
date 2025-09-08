# frozen_string_literal: true

class Api::V1::Projects::SearchController < Api::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    # Use search directly on projects
    projects = current_company.projects.kept.includes(:client)

    if params[:search_term].present?
      # Use pg_search if available, otherwise fall back to ILIKE
      if projects.respond_to?(:search)
        projects = projects.search(params[:search_term])
      else
        projects = projects.where(
          "projects.name ILIKE :query OR projects.description ILIKE :query",
          query: "%#{params[:search_term]}%"
        )
      end
    end

    # Order by name
    projects = projects.order(:name)

    render :index, locals: {
      projects: projects
    }, status: 200
  end
end

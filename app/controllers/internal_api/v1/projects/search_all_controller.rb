# frozen_string_literal: true

class InternalApi::V1::Projects::SearchAllController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    search_term = search_params[:search_term]
    search_term = search_term.downcase.strip
    search_term = search_term.gsub(/\s+/, "%")
    search_term = "%#{search_term}%"
    projects = current_company.projects.where("lower(name) LIKE ?", search_term)
    render json: { projects: projects.map(&:formatted_project) }
  end

  private

    def search_params
      params.permit(:search_term)
    end
end

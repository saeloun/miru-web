# frozen_string_literal: true

class Api::V1::Projects::SearchController < Api::V1::ApplicationController
  def index
    authorize Project
    projects = ProjectPolicy::Scope.new(current_user, current_company).resolve.includes(:client)

    if params[:search_term].present?
      if projects.respond_to?(:search)
        projects = projects.search(params[:search_term])
      else
        query = "%#{ActiveRecord::Base.sanitize_sql_like(params[:search_term].to_s)}%"
        projects = projects.where(
          "projects.name ILIKE :query OR projects.description ILIKE :query",
          query:
        )
      end
    end

    projects = projects.order(:name)

    render :index, locals: {
      projects: projects
    }, status: 200
  end
end

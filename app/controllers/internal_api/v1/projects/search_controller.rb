# frozen_string_literal: true

class InternalApi::V1::Projects::SearchController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    projects = Project.search_all_projects(search_params, current_company.id)
    render json: { projects: }
  end

  private

    def search_params
      params.require(:search_term)
    end
end

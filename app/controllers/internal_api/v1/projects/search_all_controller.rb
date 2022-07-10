# frozen_string_literal: true

class InternalApi::V1::Projects::SearchAllController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    projects = helpers.search_all_projects(search_params)
    render json: { projects: }
  end

  private

    def search_params
      params.require(:search_term)
    end
end

# frozen_string_literal: true

class InternalApi::V1::Projects::SearchController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    # projects = Project.search_all_projects_by_name(search_params, current_company.id)
    render :index, locals: {
      searched_projects:,
      total_searched_projects: searched_projects.total_count
    }, status: :ok
  end

  private

    def search_term
      @search_term ||= (params[:search_term].present?) ? params[:search_term] : ""
    end

    def client_list
      @_client_list ||= Company.find(current_company.id).clients.pluck(:id).uniq
    end

    def searched_projects
      search_result = Project.search(
        search_term,
        fields: [:client_name, :name],
        match: :text_middle,
        where: { client_id: client_list },
        includes: [:client]
      )
    end
end

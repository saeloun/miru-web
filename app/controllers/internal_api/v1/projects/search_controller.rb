# frozen_string_literal: true

class InternalApi::V1::Projects::SearchController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
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
      @_client_list ||= current_company.clients.pluck(:id).uniq
    end

    def searched_projects
      @_searched_projects ||= Project.search(
        search_term,
        fields: [:client_name, :name],
        match: :text_middle,
        where: { client_id: client_list },
        includes: [:client]
      )
    end
end

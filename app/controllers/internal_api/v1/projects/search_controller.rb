# frozen_string_literal: true

class InternalApi::V1::Projects::SearchController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    data = Projects::IndexService.new(current_company, current_user, params[:search_term]).process
    render :index, locals: {
      projects: data[:projects]
    }, status: :ok
  end
end

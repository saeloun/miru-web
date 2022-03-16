# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def show
    projects_details =
    total_minutes =
    render json: {}, status: :ok
  end

  private
    def client
      @_client ||= Client.find(params[:id])
    end
end

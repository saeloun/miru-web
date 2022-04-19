# frozen_string_literal: true

class ProjectsController < ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize Project
  end

  private

    def project_params
      params.require(:project).permit(:client_id, :name, :billable)
    end
end

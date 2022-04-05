# frozen_string_literal: true

class WorkspacesController < ApplicationController
  skip_after_action :verify_authorized

  def update
    workspace = current_user.companies.find(params[:id])
    current_user.update!(current_workspace_id: workspace.id)

    flash[:notice] = t(".success")
    redirect_to root_path
  end
end

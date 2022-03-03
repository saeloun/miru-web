# frozen_string_literal: true

class InternalApi::V1::WorkspacesController < ApplicationController
  skip_after_action :verify_authorized

  def update
    workspace = current_user.companies.find(params[:id])
    if current_user.update(current_workspace_id: workspace.id)
      render json: {
        success: true,
        workspace: workspace,
        notice: I18n.t("workspaces.update.success")
      }, status: :ok
    else
      render json: {
        errors: current_user.errors,
        notice: I18n.t("workspaces.update.failure")
      }, status: :unprocessable_entity
    end
  end
end

# frozen_string_literal: true

class InternalApi::V1::WorkspacesController < ApplicationController
  skip_after_action :verify_authorized

  def update
    workspace = current_user.companies.find(params[:id])
    current_user.update!(current_workspace_id: workspace.id)

    render json: {
      success: true,
      workspace:,
      notice: I18n.t("workspaces.update.success")
    }, status: :ok
  end
end

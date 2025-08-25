# frozen_string_literal: true

class Api::V1::WorkspacesController < ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: WorkspacePolicy
    render :index, locals: { workspaces: current_user.companies.with_kept_employments }, status: 200
  end

  def update
    authorize :update, policy_class: WorkspacePolicy

    workspace = current_user.companies.find(params[:id])
    current_user.update!(current_workspace_id: workspace.id)

    render json: {
      success: true,
      workspace:,
      notice: I18n.t("workspaces.update.success")
    }, status: 200
  end
end

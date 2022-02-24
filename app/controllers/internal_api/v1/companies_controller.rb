# frozen_string_literal: true

class InternalApi::V1::CompaniesController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized

  def switch
    new_workspace = current_user.companies.find(params[:id])
    if current_user.update(current_workspace_id: new_workspace.id)
      render json: {
        success: true,
        client: new_workspace,
        notice: I18n.t("companies.switch.success")
      }, status: :ok
    else
      render json: {
        errors: current_user.errors,
        notice: I18n.t("companies.switch.failure")
      }, status: :unprocessable_entity
    end
  end
end

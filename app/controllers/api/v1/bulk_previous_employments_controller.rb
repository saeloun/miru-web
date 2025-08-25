# frozen_string_literal: true

class Api::V1::BulkPreviousEmploymentsController < Api::V1::ApplicationController
  def update
    authorize user, policy_class: BulkPreviousEmploymentPolicy
    BulkPreviousEmploymentService.new(update_params, user, employment).process
    render json: { notice: I18n.t("employment.update.success") }
  end

  private

    def update_params
      params.require(:employments).permit(
        current_employment: [:designation, :employment_type, :joined_at, :resigned_at, :employee_id],
        added_employments: [:company_name, :role],
        updated_employments: [:id, :company_name, :role],
        removed_employment_ids: []
      )
    end

    def employment
      @_employment ||= Employment.find_by!(user_id: params[:id], company_id: current_company.id)
    end

    def user
      @_user ||= User.find_by!(id: params[:id])
    end
end

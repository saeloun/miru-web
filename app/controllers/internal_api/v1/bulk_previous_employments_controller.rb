# frozen_string_literal: true

class InternalApi::V1::BulkPreviousEmploymentsController < InternalApi::V1::ApplicationController
  def update
    authorize user, policy_class: BulkPreviousEmploymentPolicy
    BulkPreviousEmploymentService.new(update_params).process
    render json: { notice: I18n.t("employment.update.success") }
  end

  private

    def update_params
      {
        user:,
        added_employments: added_employments_params[:added_employments],
        updated_employments: updated_employments_params[:updated_employments],
        removed_employment_ids: removed_employment_params[:removed_employment_ids]
      }
    end

    def added_employments_params
      params.require(:employments).permit(added_employments: [:company_name, :role])
    end

    def updated_employments_params
      params.require(:employments).permit(updated_employments: [:id, :company_name, :role])
    end

    def removed_employment_params
      params.require(:employments).permit(removed_employment_ids: [])
    end

    def user
      @_user ||= User.find_by!(id: params[:id])
    end
end

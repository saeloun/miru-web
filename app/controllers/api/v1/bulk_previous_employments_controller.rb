# frozen_string_literal: true

class Api::V1::BulkPreviousEmploymentsController < Api::V1::ApplicationController
  def update
    authorize user, policy_class: BulkPreviousEmploymentPolicy
    BulkPreviousEmploymentService.new(update_params, user, employment).process
    render json: { notice: I18n.t("employment.update.success") }
  end

  private

    def record_invalid(exception)
      record = exception.record
      render json: {
        errors: record.errors.full_messages.first,
        error_details: { model: record.model_name.name, attribute: record.errors.first&.attribute }
      }, status: 422
    end

    def record_not_unique(exception)
      raise exception unless Employment.employee_id_conflict?(exception)

      record = Employment.new
      record.errors.add(:employee_id, :taken)
      record_invalid(ActiveRecord::RecordInvalid.new(record))
    end

    def update_params
      params.require(:employments).permit(
        current_employment: [:designation, :employment_type, :joined_at, :resigned_at, :employee_id],
        added_employments: [:company_name, :role],
        updated_employments: [:id, :company_name, :role],
        removed_employment_ids: []
      )
    end

    def employment
      @_employment ||= current_company.employments.kept.find_by!(user_id: params[:id])
    end

    def user
      @_user ||= current_company.users.find_by!(id: params[:id])
    end
end

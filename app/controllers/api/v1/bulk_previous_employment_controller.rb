# frozen_string_literal: true

class Api::V1::BulkPreviousEmploymentController < Api::V1::BaseController
  after_action :verify_authorized

  def create
    authorize PreviousEmployment, :create?

    errors = []
    created_count = 0

    params[:previous_employments].each do |employment_params|
      employment = current_user.previous_employments.build(
        previous_employment_params(employment_params)
      )

      if employment.save
        created_count += 1
      else
        errors << "#{employment_params[:company_name]}: #{employment.errors.full_messages.join(', ')}"
      end
    end

    if errors.empty?
      render json: {
        message: "#{created_count} previous employments created successfully"
      }, status: 201
    else
      render json: {
        message: "#{created_count} created, #{errors.length} failed",
        errors: errors
      }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize PreviousEmployment, :destroy?

    if params[:ids].present?
      employments = current_user.previous_employments.where(id: params[:ids])
      count = employments.destroy_all.length

      render json: {
        message: "#{count} previous employments deleted successfully"
      }, status: 200
    else
      render json: {
        errors: ["No employment IDs provided"]
      }, status: :unprocessable_entity
    end
  end

  private

    def previous_employment_params(params)
      params.permit(:company_name, :role, :start_date, :end_date, :description)
    end
end

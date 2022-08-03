# frozen_string_literal: true

# API for user to check his own record

class InternalApi::V1::PreviousEmploymentsController < InternalApi::V1::ApplicationController
  def index
    authorize PreviousEmployment
    previous_employments = current_user.previous_employments
    render :index, locals: { previous_employments: }, status: :ok
  end

  def create
    authorize PreviousEmployment
    previous_employment = current_user.previous_employments.new(previous_employment_params)
    previous_employment.save!
    render :create, locals: { previous_employment: }, status: :ok
 end

  private

    def previous_employment
      @previous_employment ||= PreviousEmployment.find(params[:id])
    end

    def previous_employment_params
      params.require(:previous_employment).permit(
        :company_name, :role
      )
    end
end

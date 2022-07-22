# frozen_string_literal: true

class InternalApi::V1::PreviousEmploymentsController < InternalApi::V1::ApplicationController
  def show
    authorize previous_employment
    render :show, locals: { previous_employment: }, status: :ok
  end

  def update
    authorize previous_employment
    previous_employment.update!(previous_employment_params)
    render :update, locals: { previous_employment: }, status: :ok
  end

  def create
    authorize PreviousEmployment
    previous_employment = current_user.previous_employments.create!(previous_employment_params)
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

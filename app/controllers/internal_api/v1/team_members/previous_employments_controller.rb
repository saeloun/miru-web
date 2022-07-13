# frozen_string_literal: true

class InternalApi::V1::TeamMembers::PreviousEmploymentsController < InternalApi::V1::ApplicationController
  def show
    authorize employment, policy_class: TeamMembers::PreviousEmploymentPolicy
    render :show, locals: { user: employment.user }, status: :ok
  end

  def update
    authorize employment, policy_class: TeamMembers::PreviousEmploymentPolicy
    user = employment.user
    previous_employments = user.previous_employments
    previous_employments.update!(previous_employment_params)
    render json: {
      previous_employments:,
      notice: ("Previous employment updated successfully.")
    }, status: :ok
  end

  private

    def employment
      @employment ||= Employment.find(params[:team_id])
    end

    def previous_employment_params
      params.require(:previous_employments).permit(
        :company_name, :role
      )
    end
end

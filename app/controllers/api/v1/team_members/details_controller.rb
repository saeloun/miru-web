# frozen_string_literal: true

class Api::V1::TeamMembers::DetailsController < Api::V1::ApplicationController
  def show
    authorize employment, policy_class: TeamMembers::DetailPolicy
    render :show, locals: { user: employment.user }, status: 200
  end

  def update
    authorize employment, policy_class: TeamMembers::DetailPolicy
    user = employment.user
    user.update!(detail_params)
    render json: {
      user:,
      notice: ("User updated successfully.")
    }, status: 200
  end

  private

    def employment
      @_employment ||= Employment.find_by(user_id: params[:team_id], company_id: current_company.id)
    end

    def detail_params
      params.require(:user).permit(
        :first_name, :last_name, :date_of_birth, :phone, :personal_email_id,
        social_accounts: {}
      )
    end
end

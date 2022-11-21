# frozen_string_literal: true

class InternalApi::V1::TeamMembers::DetailsController < InternalApi::V1::ApplicationController
  def show
    authorize employment, policy_class: TeamMembers::DetailPolicy
    render :show, locals: { user: employment.user }, status: :ok
  end

  def update
    authorize employment, policy_class: TeamMembers::DetailPolicy
    user = employment.user
    user.update!(detail_params)
    render json: {
      user:,
      notice: ("User updated successfully.")
    }, status: :ok
  end

  private
    def employment
      @employment ||= Employment.find(params[:team_id])
    end

    def detail_params
      params.require(:user).permit(
        :first_name, :last_name, :date_of_birth, :phone, :personal_email_id,
        social_accounts: {}
      )
    end
end

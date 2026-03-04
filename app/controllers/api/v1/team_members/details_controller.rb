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
    safe_user = user.as_json(
      only: [:id, :first_name, :last_name, :email, :date_of_birth, :phone, :personal_email_id],
      methods: [:full_name]
    )
    render json: {
      user: safe_user,
      notice: ("User updated successfully.")
    }, status: 200
  end

  private

    def employment
      @_employment ||= Employment.kept.find_by!(user_id: params[:team_id])
    end

    def detail_params
      params.require(:user).permit(
        :first_name, :last_name, :date_of_birth, :phone, :personal_email_id,
        social_accounts: [:github_url, :linkedin_url]
      )
    end
end

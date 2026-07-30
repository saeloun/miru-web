# frozen_string_literal: true

class Api::V1::TeamMembers::DetailsController < Api::V1::ApplicationController
  def show
    authorize employment, policy_class: TeamMembers::DetailPolicy
    render :show, locals: { user: employment.user }, status: 200
  end

  def update
    authorize employment, policy_class: TeamMembers::DetailPolicy
    user = employment.user
    return render_forbidden_phone_change if changing_another_users_phone?

    if employment.user_id == current_user.id
      result = UpdateProfileSettingsService.new(user, detail_params).process
      return render json: result[:res], status: result[:status] unless result[:status] == :ok
    else
      user.update!(detail_params.except(:current_password))
    end

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
      @_employment ||= current_company.employments.kept.find_by!(user_id: params[:team_id])
    end

    def detail_params
      params.require(:user).permit(
        :first_name, :last_name, :date_of_birth, :phone, :personal_email_id, :current_password,
        social_accounts: [:github_url, :linkedin_url]
      )
    end

    def changing_another_users_phone?
      employment.user_id != current_user.id &&
        detail_params.key?(:phone) &&
        detail_params[:phone].to_s != employment.user.phone.to_s
    end

    def render_forbidden_phone_change
      render json: { errors: "Phone changes must be completed by the account owner" }, status: 403
    end
end

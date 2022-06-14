# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  def destroy
    authorize :team
    company_user.discard!
    render json: {
      user: company_user.user,
      notice: I18n.t("team.delete.success.message")
    }, status: :ok
  end

  private

    def company_user
      @company_user ||= current_company.company_users.kept.find_by!(user_id: params[:id])
    end
end

# frozen_string_literal: true

class InternalApi::V1::TeamController < InternalApi::V1::ApplicationController
  def destroy
    # authorize user, policy_class: TeamPolicy
    authorize current_user, policy_class: TeamPolicy
    user.discard!
    render json: {
      user:,
      notice: I18n.t("team.delete.success.message")
    }, status: :ok
  end

  private

    def user
      @_user ||= current_company.users.kept.find(params[:id])
    end
end

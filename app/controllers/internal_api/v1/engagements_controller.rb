# frozen_string_literal: true

class InternalApi::V1::EngagementsController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: EngagementPolicy
    pagy, users = pagy(
      current_company.users.includes(
        [:avatar_attachment,
         :roles]).order(created_at: :desc).ransack(params[:q]).result(distinct: true),
      items_param: :leads_per_page)
    users = users.map { |user| serialize_user(user) }
    render json: { users:, pagy: pagy_metadata(pagy) }, status: :ok
  end

  def update
    authorize :update, policy_class: EngagementPolicy
    engage_params.merge!(
      engage_updated_by_id: current_user.id,
      engage_updated_at: Time.current
    )
    if engagement_user.update!(engage_params)
      render json: {
        success: true,
        user: serialize_user(engagement_user),
        notice: I18n.t("lead.update.success.message")
      }, status: :ok
    end
  end

  private

    def serialize_user(user)
      {
        id: user.id,
        name: user.full_name,
        discarded_at: user.discarded_at,
        department_id: user.department_id,
        department_name: user.department_name,
        engage_code: user.engage_code,
        engage_name: user.engage_name,
        engage_updated_by_name: user.engage_updated_by&.full_name,
        engage_updated_at: user.engage_updated_at
      }
    end

    def engagement_user
      @_engagement_user ||= current_company.users.find(params[:id])
    end

    def engage_params
      @engage_params ||= params.require(:engagement).permit(:engage_code, :engage_updated_by_id, :engage_updated_at)
    end
end

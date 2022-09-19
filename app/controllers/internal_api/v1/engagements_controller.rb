# frozen_string_literal: true

class InternalApi::V1::EngagementsController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: EngagementPolicy

    department_ids = params[:departments].to_s.split(",")
    engagement_ids = params[:engagements].to_s.split(",")
    pagy, users = pagy(
      current_company.users
        .where(department_ids.present? ? { department_id: department_ids } : [])
        .where(engagement_ids.present? ? { engage_code: engagement_ids } : nil)
        .where(Pundit.policy!(current_user, :engagement).admin_access? ? [] : (
          current_user.team_lead? ? { id: [current_user.id, *current_user.team_member_ids] } : []
        ))
        .select("(case when users.id = #{current_user.id} then 1 else 0 end) AS current_user_score, users.*")
        .includes([:avatar_attachment, :roles])
        .order(current_user_score: :desc, discarded_at: :desc, first_name: :asc)
        .ransack(params[:q]).result(distinct: true),
      items: 30)
    users = users.map { |user| serialize_user(user) }
    render json: { users:, pagy: pagy_metadata(pagy) }, status: :ok
  end

  def update
    authorize :update, policy_class: EngagementPolicy

    engage_params.merge!(
      engage_updated_by_id: current_user.id,
      engage_updated_at: Time.current,
      week_code: EngagementTimestamp.current_week_code
    )
    engagement_timeline = engagement_user.engagement_timestamps
      .find_by(week_code: EngagementTimestamp.current_week_code) || engagement_user.engagement_timestamps.new
    engagement_timeline.attributes = engage_params
    if engagement_timeline.save!
      engagement_user.update!(
        engage_code: engagement_timeline.engage_code,
        engage_updated_by_id: engagement_timeline.engage_updated_by_id,
        engage_updated_at: engagement_timeline.engage_updated_at,
        engage_week_code: engagement_timeline.week_code,
        engage_expires_at: EngagementTimestamp.current_engage_expires_at,
      )
      render json: {
        success: true,
        user: serialize_user(engagement_user)
      }, status: :ok
    end
  end

  def items
    authorize :items, policy_class: EngagementPolicy

    render json: {
      departments: User::DEPARTMENT_OPTIONS,
      engagements: EngagementTimestamp::ENGAGEMENT_OPTIONS
    }, status: :ok
  end

  private

    def serialize_user(user)
      timestamp = user.engagement_timestamps.find_by(week_code: EngagementTimestamp.current_week_code)
      previous_timestamp = user.engagement_timestamps.find_by(week_code: EngagementTimestamp.previous_week_code)
      {
        id: user.id,
        name: user.full_name,
        email: user.email,
        discarded_at: user.discarded_at,
        department_id: user.department_id,
        department_name: user.department_name,
        engagement: timestamp ? {
          code: timestamp.engage_code,
          name: timestamp.engage_name,
          updated_by_name: timestamp.engage_updated_by&.full_name,
          updated_at: timestamp.engage_updated_at.to_s,
          expires_at: user.engage_expires_at.to_s
        } : nil,
        previous_engagement: previous_timestamp ? {
          code: previous_timestamp.engage_code,
          name: previous_timestamp.engage_name,
          updated_by_name: previous_timestamp.engage_updated_by&.full_name,
          updated_at: previous_timestamp.engage_updated_at.to_s
        } : nil
      }
    end

    def engagement_user
      @_engagement_user ||= current_company.users.find(params[:id])
    end

    def engage_params
      @engage_params ||= params.require(:engagement).permit(:engage_code, :engage_updated_by_id, :engage_updated_at)
    end
end

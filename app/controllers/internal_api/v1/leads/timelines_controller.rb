# frozen_string_literal: true

class InternalApi::V1::Leads::TimelinesController < InternalApi::V1::ApplicationController
  def index
    authorize lead

    pagy, lead_timelines = pagy(
      lead.lead_timelines.order(created_at: :desc),
      items_param: :timelines_per_page)
    timeline_details = lead_timelines.map(&:render_properties)
    render json: { timeline_details:, pagy: pagy_metadata(pagy) }, status: :ok
  end

  def create
    authorize lead
    actual_timeline_params = timeline_params
    actual_timeline_params[:action_created_by_id] = current_user.id
    actual_timeline_params[:action_reporter_id] = current_user.id unless actual_timeline_params[:action_reporter_id]
    render :create, locals: {
      timeline: lead.lead_timelines.create!(actual_timeline_params)
    }
  end

  def edit
    authorize lead
    timeline_details = timeline.render_properties
    render json: { timeline_details: }, status: :ok
  end

  def show
    authorize lead
    timeline_details = timeline.render_properties
    render json: { timeline_details: }, status: :ok
  end

  def update
    authorize lead
    if timeline.update!(timeline_params)
      render json: {
        success: true,
        lead:,
        notice: I18n.t("lead.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize lead

    if timeline.discard!
      render json: {
        lead:,
        notice: I18n.t("lead.delete.success.message")
      }, status: :ok
    end
  end

  private

    def lead
      @_lead ||= Lead.find(params[:lead_id])
    end

    def timeline
      @_timeline ||= lead.lead_timelines.kept.find(params[:id])
    end

    def timeline_params
      params.require(:timeline).permit(
        policy("leads/timeline".to_sym).permitted_attributes
      )
    end
end

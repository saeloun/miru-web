# frozen_string_literal: true

class InternalApi::V1::Leads::TimelinesController < InternalApi::V1::ApplicationController
  def index
    authorize lead
    lead_timelines = lead.lead_timelines.kept.where(
      params[:q].present? ? ["name LIKE ?",
                             "%#{params[:q]}%"] : {}).distinct
    timeline_details = lead_timelines.map(&:render_properties)
    render json: { timeline_details: }, status: :ok
  end

  def create
    authorize lead
    render :create, locals: {
      timeline: lead.lead_timelines.create!(timeline_params)
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

# frozen_string_literal: true

class InternalApi::V1::Leads::QuotesController < InternalApi::V1::ApplicationController
  def index
    authorize lead
    line_items = lead.lead_line_items.where(params[:q].present? ? ["name LIKE ?", "%#{params[:q]}%"] : {}).distinct
    line_item_details = line_items.map(&:render_properties)
    render json: { line_item_details: }, status: :ok
  end

  def create
    authorize lead
    render :create, locals: {
      lead: Lead.create!(line_item_params)
    }
  end

  def show
    authorize lead
    line_item_details = lead.render_properties
    render json: { line_item_details: }, status: :ok
  end

  def update
    authorize lead

    if line_item.update!(line_item_params)
      render json: {
        success: true,
        lead:,
        notice: I18n.t("lead.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize lead

    if line_item.discard!
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

    def line_item
      @_line_items ||= lead.lead_line_items.find(params[:id])
    end

    def line_item_params
      params.require(:line_item_params).permit(
        policy(LeadLineItem).permitted_attributes
      )
    end
end

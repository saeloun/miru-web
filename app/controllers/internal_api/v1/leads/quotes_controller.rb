# frozen_string_literal: true

class InternalApi::V1::Leads::QuotesController < InternalApi::V1::ApplicationController
  def index
    authorize lead
    lead_quotes = lead.lead_quotes.kept.where(params[:q].present? ? ["name LIKE ?", "%#{params[:q]}%"] : {}).distinct
    quote_details = lead_quotes.map { |lead_quote|
  lead_quote.render_properties.merge({ lead_line_item_ids: lead_quote.lead_line_items.pluck(:id) })
}
    render json: { quote_details: }, status: :ok
  end

  def create
    authorize lead
    render :create, locals: {
      quote: lead.lead_quotes.create!(quote_params)
    }
  end

  def show
    authorize lead
    quote_details = quote.render_properties.merge({ lead_line_item_ids: quote.lead_line_items.pluck(:id) })
    render json: { quote_details: }, status: :ok
  end

  def update_line_items
    authorize lead
    # available_lead_line_item_ids = quote.lead_line_items.pluck(:id)
    # if ( lead_line_item_ids = params[:lead_line_item_ids] ).present?
    #   lead_line_item_ids.each do |lead_line_item_id|
    #     if available_lead_line_item_ids.include?(lead_line_item_id.to_i)
    #       available_lead_line_item_ids.delete(lead_line_item_id.to_i)
    #     else
    #       quote.lead_line_items.create! (lead_line_item_id: lead_line_item_id)
    #     end
    #   end
    #   quote.lead_line_items.where(lead_line_item_id: available_lead_line_item_ids).destroy_all if available_lead_line_item_ids.present?
    # end
    render json: {
      success: true,
      lead:,
      notice: I18n.t("lead.update.success.message")
    }, status: :ok
  end

  def update
    authorize lead

    if quote.update!(quote_params)
      render json: {
        success: true,
        lead:,
        notice: I18n.t("lead.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize lead

    if quote.discard!
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

    def quote
      @_quote ||= lead.lead_quotes.kept.find(params[:id])
    end

    def quote_params
      params.require(:quote).permit(
        policy("leads/quote".to_sym).permitted_attributes
      )
    end
end

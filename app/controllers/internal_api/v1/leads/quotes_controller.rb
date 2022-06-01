# frozen_string_literal: true

class InternalApi::V1::Leads::QuotesController < InternalApi::V1::ApplicationController
  def index
    authorize lead
    lead_quotes = lead.lead_quotes.kept.where(params[:q].present? ? ["name LIKE ?", "%#{params[:q]}%"] : {}).distinct
    quote_details = lead_quotes.map(&:render_properties)
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
    quote_details = quote.render_properties
    render json: { quote_details: }, status: :ok
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

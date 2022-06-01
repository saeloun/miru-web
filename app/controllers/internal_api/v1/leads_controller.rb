# frozen_string_literal: true

class InternalApi::V1::LeadsController < InternalApi::V1::ApplicationController
  def index
    authorize Lead
    # query = Lead.all.kept.ransack({ name_or_email_cont: params[:q] })
    # leads = query.result(distinct: true)
    leads = Lead.where(params[:q].present? ? ["name LIKE ?", "%#{params[:q]}%"] : {}).distinct
    lead_details = leads.map { |lead| lead.lead_detail.merge(
      {
        budget_status_code_name: lead.budget_status_code_name,
        industry_code_name: lead.industry_code_name,
        quality_code_name: lead.quality_code_name,
        state_code_name: lead.state_code_name,
        status_code_name: lead.status_code_name
      })
}
    render json: { lead_details: }, status: :ok
  end

  def items
    authorize Lead
    budget_status_codes = Lead::BUDGET_STATUS_CODE_OPTIONS

    quality_codes = Lead::QUALITY_CODE_OPTIONS

    state_codes = Lead::STATE_CODE_OPTIONS

    status_codes = Lead::STATUS_CODE_OPTIONS

    industry_codes = Lead::INDUSTRY_CODE_OPTIONS

    render json: { budget_status_codes:, quality_codes:, state_codes:, status_codes:, industry_codes: }, status: :ok
  end

  def create
    authorize Lead
    render :create, locals: {
      lead: Lead.create!(lead_params)
    }
  end

  def show
    authorize lead
    lead_details = lead.lead_detail.merge(
      {
        budget_status_code_name: lead.budget_status_code_name,
        industry_code_name: lead.industry_code_name,
        quality_code_name: lead.quality_code_name,
        state_code_name: lead.state_code_name,
        status_code_name: lead.status_code_name
      })
    render json: { lead_details: }, status: :ok
  end

  def update
    authorize lead

    if lead.update!(lead_params)
      render json: {
        success: true,
        lead:,
        notice: I18n.t("lead.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize lead

    if lead.discard!
      render json: {
        lead:,
        notice: I18n.t("lead.delete.success.message")
      }, status: :ok
    end
  end

  private

    def lead
      @_lead ||= Lead.find(params[:id])
    end

    def lead_params
      params.require(:lead).permit(
        policy(Lead).permitted_attributes
      )
    end
end

# frozen_string_literal: true

class InternalApi::V1::LeadsController < InternalApi::V1::ApplicationController
  def index
    authorize Lead
    # query = Lead.all.kept.ransack({ name_or_email_cont: params[:q] })
    # leads = query.result(distinct: true)
    leads = Lead.includes(
      :assignee, :reporter, :created_by,
      :updated_by).where(params[:q].present? ? ["name LIKE ?",
                                                "%#{params[:q]}%"] : {}).where(discarded_at: nil).distinct
    lead_details = leads.map	{	|lead|	lead.lead_detail.merge(
      {
        budget_status_code_name: lead.budget_status_code_name,
        industry_code_name:	lead.industry_code_name,
        quality_code_name:	lead.quality_code_name,
        state_code_name:	lead.state_code_name,
        status_code_name:	lead.status_code_name,
        assignee_name: lead.assignee ? "#{lead.assignee.first_name} #{lead.assignee.last_name}" : "",
        reporter_name: lead.reporter ? "#{lead.reporter.first_name} #{lead.reporter.last_name}" : "",
        created_by_name: lead.created_by ? "#{lead.created_by.first_name} #{lead.created_by.last_name}" : "",
        updated_by_name: lead.updated_by ? "#{lead.updated_by.first_name} #{lead.updated_by.last_name}" : "",
        need_name: lead.need_name,
        preferred_contact_method_code_name: lead.preferred_contact_method_code_name,
        initial_communication_name: lead.initial_communication_name,
        source_code_name: lead.source_code_name,
        priority_code_name: lead.priority_code_name
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

    line_item_kind_names = LeadLineItem::KIND_OPTIONS

    needs = Lead::NEED_OPTIONS

    preferred_contact_method_code_names = Lead::PREFERRED_CONTACT_METHOD_CODE_OPTIONS

    initial_communications = Lead::INITIAL_COMMUNICATION_OPTIONS

    source_codes = Lead::SOURCE_CODE_OPTIONS

    priority_codes = Lead::PRIORITY_CODE_OPTIONS

    countries = ISO3166::Country.pluck(:alpha2, :iso_short_name)

    render json: {
      budget_status_codes:, quality_codes:, state_codes:,
      status_codes:, industry_codes:, line_item_kind_names:,
      needs:, preferred_contact_method_code_names:,
      initial_communications:, source_codes:, priority_codes:,
      countries:
    },	status: :ok
  end

  def allowed_users
    authorize Lead

    sales_department_id = User::DEPARTMENT_OPTIONS.detect { |department| department.name == "Sales" }&.id

    allowed_user_list = User.includes(:roles).where(roles: { name: ["admin", "owner"] })
      .or(User.includes(:roles).where(
        roles: { name: "employee" }, department_id: sales_department_id)
                              )

    render json: { allowed_user_list: },	status: :ok
  end

  def create
    authorize Lead
    lead_params[:created_by_id] = current_user.id if lead_params[:created_by_id].blank?
    lead_params[:updated_by_id] = current_user.id if lead_params[:updated_by_id].blank?
    lead_params[:company_id] = current_company.id if lead_params[:company_id].blank?
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
        status_code_name: lead.status_code_name,
        assignee_name: lead.assignee ? "#{lead.assignee.first_name} #{lead.assignee.last_name}" : "",
        reporter_name: lead.reporter ? "#{lead.reporter.first_name} #{lead.reporter.last_name}" : "",
        created_by_name: lead.created_by ? "#{lead.created_by.first_name} #{lead.created_by.last_name}" : "",
        updated_by_name: lead.updated_by ? "#{lead.updated_by.first_name} #{lead.updated_by.last_name}" : "",
        need_name: lead.need_name,
        preferred_contact_method_code_name: lead.preferred_contact_method_code_name,
        initial_communication_name: lead.initial_communication_name,
        source_code_name: lead.source_code_name,
        priority_code_name: lead.priority_code_name
      })
    render json: { lead_details: }, status: :ok
  end

  def update
    authorize lead
    lead_params[:created_by_id] = current_user.id if lead_params[:created_by_id].blank?
    lead_params[:updated_by_id] = current_user.id if lead_params[:updated_by_id].blank?
    lead_params[:company_id] = current_company.id if lead_params[:company_id].blank?
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

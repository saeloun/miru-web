# frozen_string_literal: true

class InternalApi::V1::LeadsController < InternalApi::V1::ApplicationController
  def index
    authorize Lead
    pagy, leads = pagy(
      Lead.filter(params:, user: current_user, ids: false).order(created_at: :desc),
      items: 30)
    lead_details = leads.map(&:lead_detail)

    render json: { lead_details:, pagy: pagy_metadata(pagy) }, status: :ok
  end

  def actions
    authorize Lead

    pagy, lead_actions = pagy(
      LeadTimeline.with_actions(Lead.filter(params:, user: current_user, ids: true), current_user),
      items_param: :lead_actions_per_page)
    timeline_details = lead_actions.map(&:render_properties)

    render json: { timeline_details:, pagy: pagy_metadata(pagy) }, status: :ok
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

    tech_stacks = Lead::TECH_STACK_OPTIONS

    countries = ISO3166::Country.pluck(:alpha2, :iso_short_name)

    render json: {
      budget_status_codes:, quality_codes:, state_codes:,
      status_codes:, industry_codes:, line_item_kind_names:,
      needs:, preferred_contact_method_code_names:,
      initial_communications:, source_codes:, priority_codes:,
      tech_stacks:, countries:
    },	status: :ok
  end

  def timeline_items
    authorize Lead
    kind_options = LeadTimeline::KIND_OPTIONS
    schedule_action_status_codes = LeadTimeline::SCHEDULE_ACTION_STATUS_OPTIONS
    priority_codes = LeadTimeline::PRIORITY_CODE_OPTIONS

    render json: { kind_options:, schedule_action_status_codes:, priority_codes: },	status: :ok
  end

  def allowed_users
    authorize Lead

    sales_department_id = User::DEPARTMENT_OPTIONS.detect { |department| department.name == "Sales" }&.id

    allowed_user_list = User.includes(:roles).where(roles: { name: ["admin", "owner"] })
      .or(User.includes(:roles).where(
        roles: { name: "employee" }, department_id: sales_department_id)
                              ).map { |user| user.attributes.merge({ full_name: user.full_name }) }

    render json: { allowed_user_list: },	status: :ok
  end

  def create
    authorize Lead
    actual_lead_params = lead_params
    actual_lead_params[:created_by_id] = current_user.id
    actual_lead_params[:updated_by_id] = current_user.id
    actual_lead_params[:reporter_id] = current_user.id if actual_lead_params[:reporter_id].blank?
    actual_lead_params[:company_id] = current_company.id
    render :create, locals: {
      lead: Lead.create!(actual_lead_params)
    }
  end

  def show
    authorize lead
    render json: { lead_details: lead.lead_detail }, status: :ok
  end

  def update
    authorize lead
    actual_lead_params = lead_params
    actual_lead_params[:company_id] = current_company.id if lead.company_id.blank?
    actual_lead_params[:created_by_id] = current_user.id if lead.created_by_id.blank?
    actual_lead_params[:updated_by_id] = current_user.id
    if lead.update!(actual_lead_params)
      render json: {
        success: true,
        lead_details: lead.lead_detail,
        notice: I18n.t("lead.update.success.message")
      }, status: :ok
    end
  end

  def destroy
    authorize lead

    if lead.discard!
      render json: {
        lead_details: lead.lead_detail,
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

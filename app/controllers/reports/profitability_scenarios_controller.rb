# frozen_string_literal: true

class Reports::ProfitabilityScenariosController < ApplicationController
  before_action :authorize_planning
  before_action :verify_workspace, only: [:create, :update, :preview]
  before_action :set_scenario, only: [:show, :update]
  rescue_from Reports::ProfitabilityProjection::InvalidAssumptions, ActionController::ParameterMissing do |error|
    render json: { error: error.message }, status: :unprocessable_entity
  end
  rescue_from ActiveSupport::MessageVerifier::InvalidSignature do
    head 404
  end

  def index
    @scenarios = ProfitabilityScenario.where(company: current_company).order(updated_at: :desc).limit(100)
    render layout: false
  end

  def new
    assumptions = Reports::ProfitabilityPlanSeed.process(user: current_user, company: current_company, currency: params[:currency].presence || "INR")
    source = assumptions.delete("source")
    @scenario = ProfitabilityScenario.new(name: "#{Date.current.strftime('%B %Y')} plan", worksheet: { "assumptions" => assumptions, "source" => source })
    current_company.audits.create!(action: "planning_baseline", user: current_user, audited_changes: {})
    render_worksheet
  end

  def show
    render_worksheet
  end

  def create
    attributes = scenario_params
    assumptions = attributes.delete("assumptions")
    @scenario = ProfitabilityScenario.new(attributes.merge(company: current_company, created_by: current_user,
      worksheet: { "assumptions" => assumptions, "baseline" => assumptions.deep_dup, "source" => planning_source }))
    save_scenario
  end

  def update
    attributes = scenario_params
    attributes["lock_version"] = params.require(:profitability_scenario).require(:lock_version)
    @scenario.assign_attributes(attributes.except("assumptions"))
    @scenario.worksheet = @scenario.worksheet.merge("assumptions" => attributes.fetch("assumptions"))
    save_scenario
  rescue ActiveRecord::StaleObjectError
    @error = "Another edit was saved. Your changes are shown below; copy them before reloading the saved plan."
    render_worksheet(status: :conflict)
  end

  def preview
    render json: Reports::ProfitabilityProjection.new(scenario_params.fetch("assumptions")).process
  end

  def download
    data = export_verifier.verify(params[:token], purpose: :planning_export)
    return head 404 unless data.fetch("company_id") == current_company.id

    scenario = ProfitabilityScenario.where(company: current_company).find(data.fetch("id"))
    return head 404 unless scenario.lock_version == data.fetch("version")

    scenario.audits.create!(action: "export", user: current_user, associated: current_company, audited_changes: {})
    send_data Reports::ProfitabilityPlanCsv.process(scenario), type: "text/csv; charset=utf-8",
      filename: "profitability-plan-#{scenario.id}.csv", disposition: "attachment"
  end

  private

    def authorize_planning
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Robots-Tag"] = "noindex, nofollow"
      response.headers["Referrer-Policy"] = "no-referrer"
      authorize current_company, :show?, policy_class: CompensationProfitabilityPolicy
    end

    def set_scenario
      @scenario = ProfitabilityScenario.where(company: current_company).find(params[:id])
    end

    def verify_workspace
      unless params.require(:profitability_scenario)[:company_id].to_s == current_company.id.to_s
        render json: { error: "Planning workspace changed; reload the plan in its original workspace before saving" }, status: 409
      end
    end

    def scenario_params
      params.require(:profitability_scenario).permit(:name, assumptions: [:currency, :start_month, :months, :reserve_months,
        :opening_cash, :monthly_collections, { people: [:name, :capacity_hours, :utilization, :billing_rate, :monthly_compensation],
          overheads: [:name, :monthly_amount] }]).to_h.tap do |attributes|
        input = attributes.fetch("assumptions") { raise ActionController::ParameterMissing, :assumptions }
        %w[people overheads].each { |key| input[key] ||= [] }
      end
    end

    def save_scenario
      if @scenario.save
        @scenario.audits.create!(action: "plan_save", user: current_user, associated: current_company, audited_changes: {})
        redirect_to profitability_scenario_path(@scenario), status: 303
      else
        @error = @scenario.errors.full_messages.to_sentence
        render_worksheet(status: :unprocessable_entity)
      end
    end

    def export_verifier
      Rails.application.message_verifier("profitability_plan_export")
    end

    def planning_source
      token = params.require(:profitability_scenario)[:source_token]
      return { "kind" => "manual", "captured_at" => Time.current.iso8601 } if token.blank?

      data = export_verifier.verify(token, purpose: :planning_source)
      raise ActiveSupport::MessageVerifier::InvalidSignature unless data.fetch("company_id") == current_company.id

      data.fetch("source")
    end

    def render_worksheet(status: :ok)
      @assumptions = @scenario.worksheet.fetch("assumptions")
      unless @scenario.persisted?
        @source_token = export_verifier.generate({ "company_id" => current_company.id, "source" => @scenario.worksheet["source"] },
          purpose: :planning_source)
      end
      begin
        @projection = Reports::ProfitabilityProjection.new(@assumptions).process
      rescue Reports::ProfitabilityProjection::InvalidAssumptions => error
        @error ||= error.message
      end
      @baseline = Reports::ProfitabilityProjection.new(@scenario.worksheet.fetch("baseline")).process if @scenario.persisted?
      if @scenario.persisted?
        token = export_verifier.generate({ "id" => @scenario.id, "company_id" => current_company.id, "version" => @scenario.lock_version },
          expires_in: Rails.configuration.x.compensation_report_export_ttl, purpose: :planning_export)
        @export_url = profitability_scenario_export_path(token:)
      end
      render :show, layout: false, status:
    end
end

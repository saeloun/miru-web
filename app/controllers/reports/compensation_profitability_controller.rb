# frozen_string_literal: true

class Reports::CompensationProfitabilityController < ApplicationController
  before_action :prevent_caching
  before_action :authorize_report

  rescue_from Reports::CompensationProfitability::InvalidFilters, ActionController::ParameterMissing, Date::Error do |error|
    render plain: error.message, status: :unprocessable_entity
  end
  rescue_from ActiveSupport::MessageVerifier::InvalidSignature do
    head 404
  end

  def show
    filters = params.permit(:period, :anchor, :from, :to, :currency, :person_id, :primary_project_id, :client_id, :department, :status)
    report = Reports::CompensationProfitability.new(user: current_user, company: current_company, filters:).process
    ttl = Rails.configuration.x.compensation_report_export_ttl
    run = CompensationReportRun.create!(company: current_company, created_by: current_user,
      payload: JSON.parse(report.to_json), expires_at: ttl.seconds.from_now)
    @report = run.payload.deep_symbolize_keys
    @export_url = compensation_profitability_export_path(token: run.signed_id(expires_at: run.expires_at, purpose: :compensation_export))
    respond_to do |format|
      format.html do
        @employments = current_company.employments.includes(:user).order(:user_id)
        @projects = current_company.projects.order(:name)
        @clients = current_company.clients.order(:name)
        render layout: false
      end
      format.json { render json: @report.merge(export_url: @export_url, export_expires_at: run.expires_at.iso8601) }
    end
  end

  def download
    run = CompensationReportRun.find_signed!(params[:token], purpose: :compensation_export)
    unless run.company_id == current_company.id && run.created_by_id == current_user.id && run.expires_at > Time.current
      return head 404
    end
    run.audits.create!(action: "export", user: current_user, associated: current_company, audited_changes: {})
    send_data Reports::CompensationProfitabilityCsv.process(run.payload), type: "text/csv; charset=utf-8",
      filename: "compensation-profitability-#{run.payload.fetch('from')}-#{run.payload.fetch('to')}.csv", disposition: "attachment"
  end

  def configure
    unless params[:company_id].to_s == current_company.id.to_s
      return render plain: "Report workspace changed; reload the report before saving", status: 409
    end
    case params.require(:configuration)
    when "policy"
      configure_payroll_policy
    when "profile"
      employment = current_company.employments.find(params.require(:employment_id))
      attributes = params.require(:profitability_profile).permit(:primary_project_id, :department, :hours_per_day, weekdays: [])
      attributes[:weekdays] = attributes[:weekdays].reject(&:blank?) if attributes[:weekdays]
      profile = employment.profitability_profile || employment.build_profitability_profile
      profile.update!(attributes)
    when "billing_rate"
      attributes = params.require(:profitability_billing_rate).permit(:project_id, :user_id, :effective_on, :hourly_rate, :currency, :billing_method)
      current_company.projects.find(attributes[:project_id])
      current_company.employments.find_by!(user_id: attributes[:user_id])
      ProfitabilityBillingRate.create!(attributes)
    when "compensation"
      record_compensation_history
    else
      raise Reports::CompensationProfitability::InvalidFilters, "Unsupported report configuration"
    end
    redirect_to compensation_profitability_path, status: 303
  end

  private

    def configure_payroll_policy
      policy = params.require(:compensation_proration)
      unless Reports::CompensationProfitability::PRORATIONS.include?(policy)
        raise Reports::CompensationProfitability::InvalidFilters, "Choose a supported payroll proration policy"
      end
      current_company.update!(compensation_proration: policy)
      current_company.audits.create!(action: "payroll_proration", user: current_user, audited_changes: { compensation_proration: policy })
    end

    def record_compensation_history
      employment = current_company.employments.find(params.require(:employment_id))
      details = params.require(:salary_details).permit(*EmployeeRecord::SALARY_KEYS).to_h
      candidate = employment.employee_record || EmployeeRecord.new(employment:)
      candidate.private_details = details
      unless candidate.valid? && EmployeeRecord::SALARY_KEYS.all? { |key| details[key].present? }
        raise Reports::CompensationProfitability::InvalidFilters, "Supply complete valid compensation terms"
      end
      version = employment.compensation_versions.create!(salary_details: details, effective_on: Date.iso8601(details.fetch("salary_effective_on")))
      current_company.audits.create!(action: "compensation_history", user: current_user, audited_changes: { compensation_version_id: version.id })
    end

    def authorize_report
      authorize current_company, "#{action_name}?", policy_class: CompensationProfitabilityPolicy
    end

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Robots-Tag"] = "noindex, nofollow"
      response.headers["Referrer-Policy"] = "no-referrer"
    end
end

# frozen_string_literal: true

class Api::V1::EmployeeReportsController < Api::V1::EmployeeRecordAdminController
  def index
    render json: { company_id: current_company.id, employee_reports: reports.order(:id).map { |report| details(report) },
      columns: EmployeeReports::Columns.metadata, presets: EmployeeReports::Columns::PRESETS }
  end

  def create
    attributes = report_params
    return if performed?

    report = current_company.with_lock do
      raise ActionController::BadRequest if reports.count >= 100
      reports.create!(attributes.permit(:name, columns: []))
    end
    render json: { employee_report: details(report) }, status: 201
  end

  def update
    attributes = report_params
    return if performed?

    report = reports.find(params[:id])
    report.update!(attributes.permit(:name, columns: []))
    render json: { employee_report: details(report) }
  end

  def destroy
    mutation_params(:employee_report, %w[company_id])
    return if performed?

    reports.find(params[:id]).destroy!
    head 204
  end

  def download
    report = reports.find(params[:id])
    csv = EmployeeReports::DownloadService.new(report:, month: params[:month],
      employments: report_employments).process
    report.audits.create!(action: "download", user: current_user, associated: current_company, audited_changes: {})
    send_data csv, type: "text/csv; charset=utf-8", disposition: "attachment",
      filename: "employee-report-#{report.id}-#{params[:month]}.csv"
  rescue ArgumentError, Date::Error => exception
    render json: { errors: exception.message }, status: 400
  end

  private

    def reports
      EmployeeReport.where(company: current_company)
    end

    def report_employments
      staff = User.joins(:roles).where(roles: { resource_type: "Company", resource_id: current_company.id,
        name: EmployeeRecordPolicy::STAFF_ROLES }).select(:id)
      policy(EmployeeRecord).active_employments.where(user_id: staff)
    end

    def details(report)
      report.slice(:id, :company_id, :name, :columns)
    end

    def report_params
      attributes = mutation_params(:employee_report, %w[company_id name columns])
      return attributes if performed?

      if attributes.key?(:columns) && (!attributes[:columns].is_a?(Array) || !attributes[:columns].all? { |value| value.is_a?(String) })
        raise ActionController::BadRequest
      end
      attributes
    end
end

# frozen_string_literal: true

class Api::V1::SalarySlipsController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, only: [:create, :publish, :withdraw], unless: :token_authenticated_request?

  def index
    authorize SalarySlip
    slips = company_slips.includes(:employment, file_attachment: :blob)
    slips = slips.published.where(employments: { user_id: current_user.id }) unless manage?
    if params[:month].present?
      unless params[:month].is_a?(String) && params[:month].match?(/\A\d{4}-\d{2}\z/)
        return render json: { errors: "Invalid pay month" }, status: 400
      end

      slips = slips.where(pay_month: Date.iso8601("#{params[:month]}-01"))
    end
    pages = [(slips.count / 30.0).ceil, 1].max
    page = [[params[:page].to_i, 1].max, pages].min
    render json: {
      salary_slips: slips.order(pay_month: :desc, id: :desc).limit(30).offset((page - 1) * 30).map { |slip| details(slip) },
      can_manage: manage?, employments: manage? ? employee_choices : [], pagination: { page:, pages: }
    }
  rescue Date::Error
    render json: { errors: "Invalid pay month" }, status: 400
  end

  def create
    authorize SalarySlip
    employment = current_company.employments.kept.find(slip_params[:employment_id])
    raise ActiveRecord::RecordNotFound unless staff_employment?(employment)

    slip = employment.salary_slips.new(slip_params.except(:employment_id, :file).merge(uploaded_by: current_user))
    upload = slip_params[:file]
    unless upload.is_a?(ActionDispatch::Http::UploadedFile) && Marcel::MimeType.for(upload.tempfile) == "application/pdf"
      slip.errors.add(:file, "must be a PDF")
      raise ActiveRecord::RecordInvalid, slip
    end
    slip.file.attach(upload)
    slip.save!
    render json: { salary_slip: details(slip) }, status: 201
  end

  def publish
    slip = find_slip
    authorize slip
    slip.publish!(actor: current_user)
    render json: { salary_slip: details(slip) }
  end

  def withdraw
    slip = find_slip
    authorize slip
    slip.employment.with_lock { slip.reload.withdraw!(actor: current_user) }
    render json: { salary_slip: details(slip) }
  end

  def download
    slip = find_slip
    authorize slip
    slip.audits.create!(action: "download", user: current_user, associated: current_company, audited_changes: {})
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    send_data slip.file.download, filename: "salary-slip-#{slip.pay_month.strftime('%Y-%m')}.pdf",
      type: "application/pdf", disposition: "attachment"
  end

  private

    def company_slips
      SalarySlip.joins(:employment).where(employments: { company_id: current_company.id })
    end

    def find_slip
      company_slips.find(params[:id])
    end

    def manage?
      policy(SalarySlip).create?
    end

    def slip_params
      params.require(:salary_slip).permit(:employment_id, :pay_month, :source, :file)
    end

    def staff_employment?(employment)
      !employment.user.discarded? && SalarySlipPolicy::STAFF_ROLES.any? do |role|
        employment.user.has_cached_role?(role, current_company)
      end
    end

    def employee_choices
      current_company.employments.kept.includes(:user).filter_map do |employment|
        next unless staff_employment?(employment)

        { id: employment.id, name: employment.user.full_name, email: employment.user.email }
      end
    end

    def details(slip)
      {
        id: slip.id, employment_id: slip.employment_id, employee_name: slip.employment.user.full_name,
        pay_month: slip.pay_month.iso8601, source: slip.source, status: slip.status,
        filename: slip.file.filename.to_s, published_at: slip.published_at, supersedes_id: slip.supersedes_id
      }
    end
end

# frozen_string_literal: true

class Api::V1::SalarySlipsController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, only: [:create, :publish, :withdraw, :email], unless: :token_authenticated_request?
  before_action -> { response.headers["Cache-Control"] = "private, no-store" }

  def index
    authorize SalarySlip
    can_manage = policy(SalarySlip).create?
    slips = company_slips.includes(employment: :user, file_attachment: :blob)
    slips = slips.published.where(employments: { user_id: current_user.id }) unless can_manage
    if params[:month].present?
      unless params[:month].is_a?(String) && params[:month].match?(/\A\d{4}-\d{2}\z/)
        return render json: { errors: "Invalid pay month" }, status: 400
      end

      slips = slips.where(pay_month: Date.iso8601("#{params[:month]}-01"))
    end
    pages = [(slips.count / 30.0).ceil, 1].max
    value = params[:page] || "1"
    unless value.is_a?(String) && value.match?(/\A\d+\z/)
      return render json: { errors: "Invalid page" }, status: 400
    end
    page = [[value.to_i, 1].max, pages].min
    render json: {
      salary_slips: slips.order(pay_month: :desc, id: :desc).limit(30).offset((page - 1) * 30).map { |slip| details(slip) },
      can_manage:, employments: can_manage ? employee_choices : [], pagination: { page:, pages: }
    }
  rescue Date::Error
    render json: { errors: "Invalid pay month" }, status: 400
  end

  def create
    authorize SalarySlip
    attributes = slip_params
    employment = current_company.employments.kept.find(attributes[:employment_id])
    raise ActiveRecord::RecordNotFound unless staff_employment?(employment)

    slip = employment.salary_slips.new(attributes.except(:employment_id, :file).merge(uploaded_by: current_user))
    upload = attributes[:file]
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
    slip.withdraw!(actor: current_user)
    render json: { salary_slip: details(slip) }
  end

  def download
    slip = find_slip
    authorize slip
    response.headers["X-Content-Type-Options"] = "nosniff"
    data = slip.file.download
    slip.audits.create!(action: "download", user: current_user, associated: current_company, audited_changes: {})
    send_data data, filename: "salary-slip-#{slip.pay_month.strftime('%Y-%m')}.pdf",
      type: "application/pdf", disposition: "attachment"
  rescue ActiveStorage::FileNotFoundError
    render json: { errors: "Document is unavailable. Please contact your workspace administrator." }, status: 404
  end

  def email
    authorize SalarySlip
    unless params[:company_id].to_s == current_company.id.to_s
      return render json: { errors: "Workspace changed. Reload salary slips before sending." }, status: 409
    end
    slip = find_slip
    recipient = slip.email_recipient
    unless slip.status == "published" && recipient.present? && params[:expected_recipient_email] == recipient
      return render json: { errors: "Recipient or publication changed. Reload salary slips before sending." },
        status: 422
    end
    SalarySlipEmailJob.perform_later(slip.id, current_user.id, current_company.id, recipient)
    render json: { queued: true }, status: 202
  end

  private

    def company_slips
      SalarySlip.joins(:employment).where(employments: { company_id: current_company.id })
    end

    def find_slip
      company_slips.find(params[:id])
    end

    def slip_params
      params.expect(salary_slip: [:employment_id, :pay_month, :source, :file])
    end

    def staff_employment?(employment)
      !employment.user.discarded? && SalarySlipPolicy::STAFF_ROLES.any? do |role|
        employment.user.has_cached_role?(role, current_company)
      end
    end

    def employee_choices
      current_company.employments.kept.includes(user: :roles).filter_map do |employment|
        next unless staff_employment?(employment)

        { id: employment.id, name: employment.user.full_name, email: employment.user.email }
      end
    end

    def details(slip)
      {
        id: slip.id, employment_id: slip.employment_id, employee_name: slip.employment.user.full_name,
        pay_month: slip.pay_month.iso8601, source: slip.source, status: slip.status,
        filename: slip.file.filename.to_s, published_at: slip.published_at, supersedes_id: slip.supersedes_id,
        employee_email: policy(SalarySlip).create? ? slip.email_recipient : nil
      }
    end
end

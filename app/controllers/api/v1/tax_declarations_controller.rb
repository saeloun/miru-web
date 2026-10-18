# frozen_string_literal: true

class Api::V1::TaxDeclarationsController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, only: [:create, :submit, :review, :withdraw], unless: :token_authenticated_request?
  before_action -> { response.headers["Cache-Control"] = "private, no-store" }

  def index
    authorize TaxDeclaration
    records = company_records.includes(:corrections, employment: :user, evidence_attachments: :blob)
    records = records.where(employments: { user_id: current_user.id }) unless policy(TaxDeclaration).manage?
    if params[:tax_year].present?
      return render json: { errors: "Unsupported tax year" }, status: 400 unless TaxDeclaration::YEARS.map(&:to_s).include?(params[:tax_year])

      records = records.where(tax_year: params[:tax_year])
    end
    page_value = params[:page]
    unless page_value.nil? || (page_value.is_a?(String) && page_value.match?(/\A\d+\z/))
      return render json: { errors: "Invalid page" }, status: 400
    end
    pages = [(records.count / 30.0).ceil, 1].max
    page = [[(page_value || "1").to_i, 1].max, pages].min
    render json: { tax_declarations: records.order(id: :desc).limit(30).offset((page - 1) * 30).map { |record| details(record) },
      categories: TaxDeclaration::CATEGORIES, tax_years: TaxDeclaration::YEARS, calculation_enabled: false,
      pagination: { page:, pages: } }
  end

  def show
    record = find_record
    authorize record
    render json: { tax_declaration: details(record) }
  end

  def create
    authorize TaxDeclaration
    unless claim_params[:company_id].to_s == current_company.id.to_s
      return render json: { errors: "Workspace changed. Reload before uploading a declaration." }, status: 409
    end
    employment = current_user.employments.kept.find_by!(company: current_company)
    record = employment.tax_declarations.new(claim_params.except(:company_id, :evidence, :supersedes_id, :reuse_evidence))
    employment.with_lock do
      if claim_params[:supersedes_id].present?
        previous = company_records.find(claim_params[:supersedes_id])
        authorize previous, :revise?
        record.supersedes = previous
        record.evidence = previous.evidence.map(&:blob) if claim_params[:reuse_evidence] == "true"
      end
      uploads = Array(claim_params[:evidence]).compact_blank
      uploads.each do |upload|
        unless upload.is_a?(ActionDispatch::Http::UploadedFile) &&
            TaxDeclaration::EVIDENCE_TYPES.include?(Marcel::MimeType.for(upload.tempfile))
          record.invalid!("Evidence must be an uploaded PDF, JPEG or PNG")
        end
      end
      record.evidence = record.evidence.map(&:blob) + uploads
      record.save!
    end
    render json: { tax_declaration: details(record) }, status: 201
  end

  def submit
    record = find_record
    authorize record
    record.submit!
    render json: { tax_declaration: details(record) }
  end

  def review
    record = find_record
    authorize record
    review = params.require(:review).permit(:decision, :approved_amount, :reason)
    record.review!(actor: current_user, decision: review[:decision], amount: review[:approved_amount], reason: review[:reason])
    render json: { tax_declaration: details(record) }
  end

  def withdraw
    record = find_record
    authorize record
    record.withdraw!(actor: current_user)
    render json: { tax_declaration: details(record) }
  end

  def download
    record = find_record
    authorize record
    file = record.evidence.find(params[:evidence_id])
    record.audits.create!(action: "download", user: current_user, associated: current_company, audited_changes: {})
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    send_data file.download, filename: file.filename.to_s, type: file.blob.content_type, disposition: "attachment"
  end

  private

    def company_records
      TaxDeclaration.joins(:employment).where(employments: { company_id: current_company.id })
    end

    def find_record
      company_records.find(params[:id])
    end

    def claim_params
      params.require(:tax_declaration).permit(:company_id, :tax_year, :category, :claimed_amount, :notes,
        :supersedes_id, :reuse_evidence, evidence: [])
    end

    def details(record)
      authorization = policy(record)
      { id: record.id, employee_name: record.employment.user.full_name, tax_year: record.tax_year,
        category: record.category, claimed_amount: record.claimed_amount.to_s("F"),
        approved_amount: record.approved_amount&.to_s("F"), notes: record.notes, status: record.status,
        review_reason: record.review_reason, reviewed_at: record.reviewed_at, supersedes_id: record.supersedes_id,
        revision_id: record.corrections.first&.id,
        can_submit: authorization.submit? && record.status == "draft" && record.corrections.empty?,
        can_review: authorization.review? && record.status == "submitted" && record.corrections.empty?,
        can_revise: authorization.revise? && record.corrections.empty?,
        can_withdraw: authorization.withdraw? && record.status != "withdrawn",
        evidence: record.evidence.map { |file| { id: file.id, filename: file.filename.to_s } } }
    end
end

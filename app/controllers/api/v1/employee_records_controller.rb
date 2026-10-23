# frozen_string_literal: true

class Api::V1::EmployeeRecordsController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, only: [:update, :upload_document, :create_payment], unless: :token_authenticated_request?
  prepend_before_action :prevent_caching
  before_action :authorize_access

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Invalid employee record parameters" }, status: 400
  end
  rescue_from ActiveRecord::RecordNotUnique do
    render json: { errors: "Reference has already been recorded" }, status: 422
  end

  def show
    employment = find_employment(params[:user_id])
    render json: { employee_record: details(employment) }
  end

  def update
    attributes = mutation_params(:employee_record, %w[company_id user_id private_details])
    return if performed?

    employment = find_employment(attributes[:user_id])
    values = attributes[:private_details]
    raise ActionController::BadRequest unless values.is_a?(ActionController::Parameters)
    values = values.to_unsafe_h
    if (values.keys & EmployeeRecord::SALARY_KEYS).any?
      authorize EmployeeRecord, :manage?
    end
    employment.with_lock do
      authorize employment, :update?, policy_class: EmployeeRecordPolicy
      record = employment.employee_record || employment.build_employee_record
      record.private_details = record.private_details.merge(values)
      record.save!
      record.audits.create!(action: "update", user: current_user, associated: current_company, audited_changes: {})
    end
    render json: { employee_record: details(employment) }
  end

  def upload_document
    attributes = mutation_params(:employee_document, %w[company_id user_id kind file])
    return if performed?

    employment = find_employment(attributes[:user_id])
    authorize EmployeeRecord, :manage? if attributes[:kind] == "contract"
    document = employment.employee_documents.new(kind: attributes[:kind], uploaded_by: current_user)
    upload = attributes[:file]
    unless upload.is_a?(ActionDispatch::Http::UploadedFile) &&
        EmployeeDocument::CONTENT_TYPES.include?(Marcel::MimeType.for(upload.tempfile))
      document.errors.add(:file, "must be an uploaded PDF, JPEG or PNG")
      raise ActiveRecord::RecordInvalid, document
    end
    document.file.attach(io: upload.tempfile, filename: upload.original_filename,
      content_type: Marcel::MimeType.for(upload.tempfile))
    employment.with_lock do
      authorize employment, :update?, policy_class: EmployeeRecordPolicy
      document.save!
    end
    render json: { employee_document: document_details(document) }, status: 201
  end

  def download_document
    employment = find_employment(params[:user_id])
    raise ActionController::BadRequest unless params[:kind].is_a?(String)

    document = employment.employee_documents.where(kind: params[:kind]).find(params[:id])
    data = document.file.download
    document.audits.create!(action: "download", user: current_user, associated: current_company, audited_changes: {})
    send_data data, filename: document.file.filename.to_s, type: document.file.blob.content_type, disposition: "attachment"
  rescue ActiveStorage::FileNotFoundError
    render json: { errors: "Document is unavailable. Please contact your workspace administrator." }, status: 404
  end

  def payments
    employment = find_employment(params[:user_id])
    value = params[:page] || "1"
    unless value.is_a?(String) && value.match?(/\A[1-9]\d{0,4}\z/)
      return render json: { errors: "Invalid page" }, status: 400
    end
    page = value.to_i
    payments = employment.employee_payments.order(paid_on: :desc, id: :desc).offset((page - 1) * 20).limit(21).to_a
    render json: { employee_payments: payments.first(20).map { |payment| payment_details(payment) },
      company_id: current_company.id, can_manage: policy(EmployeeRecord).manage?, source: "manually_recorded",
      pagination: { page:, per_page: 20, has_more: payments.length > 20 } }
  end

  def create_payment
    authorize EmployeeRecord, :manage?
    attributes = mutation_params(:employee_payment, %w[company_id user_id paid_on amount currency reference note])
    return if performed?

    employment = find_employment(attributes[:user_id])
    unless attributes.except(:company_id, :user_id).values.all? { |value| value.nil? || value.is_a?(String) }
      return render json: { errors: "Payment fields must be text" }, status: 422
    end
    payment = employment.employee_payments.new(attributes.permit(:paid_on, :amount, :currency, :reference, :note))
    payment.created_by = current_user
    employment.with_lock do
      authorize employment, :update?, policy_class: EmployeeRecordPolicy
      payment.save!
    end
    render json: { employee_payment: payment_details(payment) }, status: 201
  end

  private

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Content-Type-Options"] = "nosniff"
    end

    def authorize_access
      authorize EmployeeRecord, :index?
      raise Pundit::NotAuthorizedError if current_company.id != current_user.current_workspace_id
    end

    def mutation_params(key, allowed)
      attributes = params.require(key)
      unless attributes.is_a?(ActionController::Parameters) && (attributes.keys - allowed).empty?
        raise ActionController::BadRequest
      end
      identity = attributes[:company_id]
      unless (identity.is_a?(String) || identity.is_a?(Integer)) && identity.to_s == current_company.id.to_s
        render json: { errors: "Employee records workspace changed; reload the current workspace" }, status: 409
      end
      attributes
    end

    def find_employment(user_id)
      user_id ||= current_user.id
      unless (user_id.is_a?(String) || user_id.is_a?(Integer)) && user_id.to_s.match?(/\A[1-9]\d{0,18}\z/)
        raise ActionController::BadRequest
      end
      employment = policy(EmployeeRecord).active_employments.find_by!(user_id:)
      authorize employment, :show?, policy_class: EmployeeRecordPolicy
      employment
    end

    def details(employment)
      user = employment.user
      documents = employment.employee_documents.includes(file_attachment: :blob).order(created_at: :desc, id: :desc)
      {
        company_id: current_company.id, can_manage: policy(EmployeeRecord).manage?,
        user: user.slice(:id, :first_name, :last_name, :date_of_birth, :phone, :personal_email_id, :social_accounts).merge(
          addresses: user.addresses.map do |address|
            address.slice(:id, :address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin)
          end),
        employment: employment.slice(:id, :employee_id, :designation, :employment_type, :joined_at, :resigned_at),
        private_details: (employment.employee_record || employment.build_employee_record).details_with_defaults,
        documents: EmployeeDocument::KINDS.index_with do |kind|
          documents.filter_map { |document| document_details(document) if document.kind == kind }
        end
      }
    end

    def document_details(document)
      { id: document.id, kind: document.kind, filename: document.file.filename.to_s,
        content_type: document.file.blob.content_type, byte_size: document.file.blob.byte_size,
        uploaded_by_id: document.uploaded_by_id, created_at: document.created_at.iso8601 }
    end

    def payment_details(payment)
      { id: payment.id, employment_id: payment.employment_id, paid_on: payment.paid_on.iso8601,
        amount: format("%.2f", payment.amount), currency: payment.currency, reference: payment.reference,
        note: payment.note, created_by_id: payment.created_by_id, created_at: payment.created_at.iso8601 }
    end
end

# frozen_string_literal: true

class Api::V1::SignatureRequestsController < Api::V1::ApplicationController
  include AgreementAuthoring
  SUMMARY = %i[id company_id created_by_id client_id employment_id title current_revision_id lock_version created_at updated_at].freeze
  CREATE_KEYS = %w[company_id title creation_key client_id employment_id].freeze
  UPDATE_KEYS = %w[company_id lock_version title recipients fields].freeze

  before_action do
    response.headers["X-Content-Type-Options"] = "nosniff"
  end
  rescue_from SignatureRequest::Conflict do |error|
    render json: { errors: error.message }, status: 409
  end
  rescue_from Signatures::PdfInfo::InvalidDocument do |error|
    render json: { errors: error.message }, status: 422
  end
  rescue_from Signatures::PdfInfo::Unavailable, Signatures::Upload::Unavailable do |error|
    render json: { errors: error.message }, status: 503
  end
  rescue_from ActionController::ParameterMissing, ActionController::BadRequest, JSON::ParserError, JSON::NestingError do
    render json: { errors: "Invalid signing request parameters" }, status: 400
  end
  rescue_from ActiveRecord::RecordNotUnique do
    render json: { errors: "This upload was already recorded. Reload before retrying." }, status: 409
  end

  def index
    authorize SignatureRequest
    records, pagination = agreement_page(company_requests.joins(:current_revision).select(*SUMMARY.map { |column| "signature_requests.#{column}" },
      "signature_request_revisions.status AS revision_status", "signature_request_revisions.number AS revision_number"))
    render json: { signature_requests: records.map { |record| metadata(record) }, pagination: }
  end

  def show
    record = find_request
    render json: { signature_request: details(record, record.current_revision) }
  end

  def create
    authorize SignatureRequest
    attributes = payload(CREATE_KEYS)
    return unless current_agreement_workspace?(attributes)

    client = current_company.clients.kept.find(attributes[:client_id]) if attributes[:client_id].present?
    employment = current_company.employments.kept.find(attributes[:employment_id]) if attributes[:employment_id].present?
    upload = Signatures::Upload.new(params[:files])
    fingerprint = Digest::SHA256.hexdigest(JSON.generate([attributes[:title], client&.id, employment&.id, upload.creation_facts]))
    created = false
    record = nil
    upload.with_cleanup do
      current_user.with_lock do
        authorize_current_workspace!
        record, created = create_or_recover(attributes, client:, employment:, upload:, fingerprint:)
      end
    end
    render json: { signature_request: details(record, record.current_revision) }, status: created ? 201 : 200
  end

  def update
    mutate
  end

  def sources
    mutate(replace: true)
  end

  def revision
    record = find_request
    render json: { signature_request: details(record, record.signature_revisions.find(params[:revision_id])) }
  end

  def original
    record = find_request
    revision = record.signature_revisions.find(params[:revision_id])
    data, document = revision.original_bytes(params[:key])
    record.audits.create!(action: "download", user: current_user, associated: current_company,
      audited_changes: { revision_id: revision.id })
    response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
    send_data data, filename: document.fetch("filename"), type: "application/pdf", disposition: "attachment"
  rescue ActiveStorage::FileNotFoundError
    render json: { errors: "Document is unavailable. Contact your workspace administrator." }, status: 404
  end

  private

    def company_requests
      SignatureRequest.where(company: current_company)
    end

    def find_request
      company_requests.find(params[:id]).tap { |record| authorize record }
    end

    def authorize_current_workspace!
      authorize SignatureRequest, :create?
      raise Pundit::NotAuthorizedError unless current_user.current_workspace_id == current_company.id
    end

    def create_or_recover(attributes, client:, employment:, upload:, fingerprint:)
      record = company_requests.find_by(creation_key: attributes[:creation_key])
      if record
        unless record.created_by_id == current_user.id && record.creation_digest == fingerprint
          raise SignatureRequest::Conflict, "This upload reference belongs to different content. Start a new upload."
        end
        return [record, false]
      end

      record = SignatureRequest.create!(company: current_company, created_by: current_user, client:, employment:,
        title: attributes[:title], creation_key: attributes[:creation_key], creation_digest: fingerprint)
      record.revise!(actor: current_user, attributes:, upload:)
      [record, true]
    end

    def mutate(replace: false)
      record = find_request
      attributes = payload(replace ? %w[company_id lock_version] : UPDATE_KEYS)
      return unless current_agreement_workspace?(attributes)

      upload = Signatures::Upload.new(params[:files]) if replace
      operation = lambda do
        current_user.with_lock do
          record.with_lock do
            authorize record, :update?
            version = attributes[:lock_version]
            unless version.is_a?(Integer) && version >= 0 && version == record.lock_version
              raise ActiveRecord::StaleObjectError.new(record, "update")
            end
            record.revise!(actor: current_user, attributes:, upload:)
          end
        end
      end
      upload ? upload.with_cleanup(&operation) : operation.call
      render json: { signature_request: details(record, record.current_revision) }
    end

    def payload(allowed)
      value = params.require(:signature_request)
      value = JSON.parse(value, max_nesting: 20) if value.is_a?(String) && value.bytesize <= Signatures::Configuration::MAX_BYTES
      value = value.to_unsafe_h if value.is_a?(ActionController::Parameters)
      raise ActionController::BadRequest unless value.is_a?(Hash) && (value.keys - allowed).empty?

      value.symbolize_keys
    end

    def metadata(record)
      record.slice(*SUMMARY).merge(status: record.has_attribute?(:revision_status) ? record[:revision_status] : record.current_revision.status,
        revision_number: record.has_attribute?(:revision_number) ? record[:revision_number] : record.current_revision.number)
    end

    def details(record, revision)
      metadata(record).merge(revision: revision.slice(:id, :number, :title, :status, :content_digest, :signing_options, :created_at, :approved_at).merge(
        documents: revision.documents.map { |document| document.except("blob_id") }, recipients: revision.recipients, fields: revision.fields),
        revisions: record.signature_revisions.order(number: :desc).pluck(:id, :number, :status, :created_at).map do |id, number, status, created_at|
          { id:, number:, status:, created_at: }
        end)
    end
end

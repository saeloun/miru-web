# frozen_string_literal: true

class Api::V1::SignatureArchivesController < Api::V1::ApplicationController
  include AgreementAuthoring
  before_action :check_workspace

  rescue_from ActionController::BadRequest do
    render json: { errors: "Choose a valid client or team member and page." }, status: 400
  end
  rescue_from Signatures::Upload::Unavailable do |error|
    render json: { errors: error.message }, status: 503
  end
  rescue_from ActiveStorage::FileNotFoundError do
    render json: { errors: "The archived document is unavailable. Contact your workspace administrator." }, status: 404
  end

  def index
    authorize SignatureRequest, :archives?
    requests = policy_scope(SignatureRequest)
    filters = params.permit(:client_id, :user_id).to_h
    raise ActionController::BadRequest if filters.size > 1 || filters.values.any? { |value| !value.to_s.match?(/\A[1-9]\d{0,17}\z/) }

    requests = requests.where(client_id: filters["client_id"]) if filters["client_id"]
    if filters["user_id"]
      requests = requests.where(employment_id: current_company.employments.kept.where(user_id: filters["user_id"]).select(:id))
    end
    records, pagination = agreement_page(archived_versions(requests))
    render json: { company_id: current_company.id, archives: records.map { |revision|
      revision.slice(:id, :signature_request_id, :number, :title, :archived_at).merge(files: revision.archive_summary.fetch(:files))
    }, pagination: }
  end

  def download
    revision = archived_versions(policy_scope(SignatureRequest)).find(params[:id])
    authorize revision.signature_request, :archive?
    data, item = revision.artifact_bytes(params[:key])
    revision.signature_request.audits.create!(action: "signed_archive_download", user: current_user, associated: current_company,
      audited_changes: { revision_id: revision.id, artifact_key: item.fetch("key"), kind: item.fetch("kind") })
    response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
    send_data data, filename: item.fetch("filename"), type: "application/pdf", disposition: "attachment"
  end

  private

    def check_workspace
      response.headers["X-Content-Type-Options"] = "nosniff"
      return head 403 unless current_company

      current_agreement_workspace?(company_id: params[:company_id])
    end

    def archived_versions(requests)
      SignatureRequestRevision.where(signature_request_id: requests.select(:id), status: "signed").where.not(archived_at: nil)
    end
end

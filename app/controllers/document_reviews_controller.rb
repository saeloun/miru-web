# frozen_string_literal: true

class DocumentReviewsController < ActionController::Base
  # These JSON requests authenticate with a body-only capability, never a user session.
  skip_forgery_protection only: [:open, :comment, :original]
  before_action :private_headers
  before_action :find_invitation, except: :show
  rescue_from SignatureReviewInvitation::Unavailable do
    render json: { errors: "This review link is unavailable. Ask the sender for a new link." }, status: 410
  end
  rescue_from ActiveRecord::RecordNotFound, ActiveStorage::FileNotFoundError do
    render json: { errors: "Document unavailable." }, status: 404
  end
  rescue_from Signatures::Upload::Unavailable do
    render json: { errors: "The original document could not be verified." }, status: 503
  end
  rescue_from ActiveRecord::RecordInvalid do |error|
    render json: { errors: error.record.errors.full_messages.join(". ") }, status: 422
  end
  rescue_from ActionController::BadRequest, ActionController::ParameterMissing do
    render json: { errors: "Invalid review request." }, status: 400
  end

  def show
    render :show, layout: false
  end

  def open
    render json: { review: review_details }
  end

  def comment
    @invitation.respond!(body: @attributes[:body], decision: @attributes[:decision])
    render json: { review: review_details }
  end

  def original
    data, document = @invitation.revision.original_bytes(@attributes[:document_key])
    response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
    send_data data, filename: document.fetch("filename"), type: "application/pdf", disposition: "attachment"
  end

  private

    def private_headers
      response.headers.merge!("Cache-Control" => "private, no-store", "Referrer-Policy" => "no-referrer",
        "X-Content-Type-Options" => "nosniff", "X-Robots-Tag" => "noindex, nofollow", "X-Frame-Options" => "DENY")
    end

    def find_invitation
      value = params.require(:signature_review)
      allowed = { "open" => %w[token before_id], "comment" => %w[token body decision], "original" => %w[token document_key] }.fetch(action_name)
      raise ActionController::BadRequest unless value.is_a?(ActionController::Parameters) &&
        (value.keys - allowed).empty?

      @attributes = value.to_unsafe_h.symbolize_keys
      token = @attributes[:token]
      raise SignatureReviewInvitation::Unavailable unless token.is_a?(String) && token.match?(SignatureReviewInvitation::TOKEN)

      @invitation = SignatureReviewInvitation.find_by(access_token: token)
      raise SignatureReviewInvitation::Unavailable unless @invitation&.active?
    end

    def review_details
      revision = @invitation.revision
      revision.review_comments_page(before_id: @attributes[:before_id]).merge(
        name: @invitation.recipient.fetch("name"), company_name: revision.signature_request.company.name,
        expires_at: @invitation.expires_at, decision: @invitation.decision,
        revision: revision.slice(:number, :title, :content_digest, :signing_options, :status).merge(
          documents: revision.documents.map { |document| document.except("blob_id") }, fields: revision.fields,
          recipients: revision.recipients.map { |recipient| recipient.slice("id", "name", "role", "authentication") }))
    end
end

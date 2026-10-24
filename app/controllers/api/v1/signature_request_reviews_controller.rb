# frozen_string_literal: true

class Api::V1::SignatureRequestReviewsController < Api::V1::SignatureRequestsController
  CONTEXT_KEYS = %w[company_id lock_version revision_id content_digest].freeze
  before_action :set_review_request

  def show
    revision = @record.signature_revisions.find(params[:revision_id] || @record.current_revision_id)
    render json: { review: summary(revision) }
  end

  def invite
    change(%w[recipient_id]) { |workflow| workflow.invite }
  end

  def revoke
    change { |workflow| workflow.revoke(params[:invitation_id]) }
  end

  def comment
    change(%w[body]) { |workflow| workflow.comment }
  end

  def approve
    change(%w[approval_source approval_note]) { |workflow| workflow.approve }
  end

  private

    def set_review_request
      @record = company_requests.find(params[:signature_request_id])
      authorize @record, request.get? ? :show? : :update?
    end

    def change(keys = [])
      attributes = payload(CONTEXT_KEYS + keys)
      return unless current_agreement_workspace?(attributes)

      result = current_user.with_lock do
        authorize @record, :update?
        yield Signatures::Review.new(@record, actor: current_user, attributes:)
      end
      enqueue_invitation(result) if action_name == "invite"
      render json: { signature_request: details(@record, @record.current_revision), review: summary(@record.current_revision) },
        status: %w[invite comment].include?(action_name) ? :created : :ok
    end

    def enqueue_invitation(invitation)
      job = SignatureReviewMailer.invite(invitation.id).deliver_later
      invitation.update!(email_status: "failed") unless job && job.successfully_enqueued?
    rescue ActiveJob::EnqueueError
      invitation.update!(email_status: "failed")
    end

    def summary(revision)
      revision.review_comments_page(before_id: request.get? ? params[:before_id] : nil).merge(
        invitations: revision.review_invitations.order(:id).map do |invitation|
          invitation.slice(:id, :recipient_id, :expires_at, :revoked_at, :decision, :decided_at, :email_status, :email_sent_at)
            .merge(name: invitation.recipient.fetch("name"))
        end,
        approval: revision.slice(:approved_by_id, :approved_at, :approval_digest, :approval_source, :approval_note))
    end
end

# frozen_string_literal: true

class SignatureReviewInvitation < ApplicationRecord
  class Unavailable < StandardError; end
  TOKEN = /\A[1-9A-HJ-NP-Za-km-z]{32}\z/

  belongs_to :revision, class_name: "SignatureRequestRevision"
  belongs_to :invited_by, class_name: "User"
  has_many :review_comments, class_name: "SignatureReviewComment", foreign_key: :author_invitation_id,
    dependent: :restrict_with_exception
  encrypts :access_token, deterministic: true
  has_secure_token :access_token, length: 32, on: :create
  self.filter_attributes += [:access_token]

  validates :recipient_id, presence: true
  validates :expires_at, presence: true
  validates :email_status, inclusion: { in: %w[queued sent failed] }
  validates :decision, inclusion: { in: %w[approved changes_requested] }, allow_nil: true
  validate -> { errors.add(:base, "Choose a signer or reviewer on this version") unless recipient && recipient["role"] != "cc" }
  validate :fixed_identity, on: :update

  def recipient
    revision.recipients.find { |item| item["id"] == recipient_id }
  end

  def active?
    revoked_at.nil? && expires_at > Time.current && revision.signature_request.reload.current_revision_id == revision_id &&
      %w[draft under_review changes_requested approved].include?(revision.reload.status)
  end

  def respond!(body:, decision: nil)
    revision.signature_request.with_lock do
      reload
      raise Unavailable unless active?
      unless (body.nil? || body.is_a?(String)) && (decision.nil? || %w[approved changes_requested].include?(decision)) &&
          (body.present? || decision == "approved")
        errors.add(:base, "Write a comment or choose a valid review decision")
        raise ActiveRecord::RecordInvalid.new(self)
      end
      revision.review_comments.create!(author_invitation: self, body: body.strip) if body.present?
      if decision
        update!(decision:, decided_at: Time.current)
        requested = revision.review_invitations.where(revoked_at: nil, decision: "changes_requested").exists?
        revision.update!(status: requested ? "changes_requested" : "under_review",
          approved_by: nil, approved_at: nil, approval_digest: nil, approval_source: nil, approval_note: nil)
        revision.signature_request.touch
      end
    end
  end

  private

    def fixed_identity
      if %w[revision_id recipient_id invited_by_id].any? { |attribute| will_save_change_to_attribute?(attribute) }
        errors.add(:base, "Create a new invitation to change its version or recipient")
      end
    end
end

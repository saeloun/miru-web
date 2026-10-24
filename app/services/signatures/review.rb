# frozen_string_literal: true

class Signatures::Review
  def initialize(record, actor:, attributes:)
    @record, @actor, @attributes = record, actor, attributes
  end

  def invite
    change do |revision|
      recipient_id = @attributes[:recipient_id]
      revision.review_invitations.where(recipient_id:, revoked_at: nil).update_all(revoked_at: Time.current)
      invitation = revision.review_invitations.create!(recipient_id:, invited_by: @actor, expires_at: 7.days.from_now)
      revision.update!(status: "under_review", approved_by: nil, approved_at: nil,
        approval_digest: nil, approval_source: nil, approval_note: nil)
      invitation
    end
  end

  def revoke(id)
    change { |revision| revision.review_invitations.find(id).update!(revoked_at: Time.current) }
  end

  def comment
    change(touch: false) { |revision| revision.review_comments.create!(author_user: @actor, body: @attributes[:body]) }
  end

  def approve
    change do |revision|
      failures = approval_errors(revision)
      source = @attributes[:approval_source]
      if failures.any?
        failures.each { |message| revision.errors.add(:base, message) }
        raise ActiveRecord::RecordInvalid.new(revision)
      end
      revision.update!(status: "approved", approved_by: @actor, approved_at: Time.current,
        approval_digest: revision.content_digest, approval_source: source,
        approval_note: source == "manual" ? @attributes[:approval_note].strip : nil)
    end
  end

  private

    def approval_errors(revision)
      invitations = revision.review_invitations.where(revoked_at: nil).to_a
      failures = revision.configuration.ready_errors
      failures << "Resolve requested changes before recording approval" if invitations.any? { |item| item.decision == "changes_requested" }
      failures + approval_source_errors(invitations)
    end

    def approval_source_errors(invitations)
      case @attributes[:approval_source]
      when "reviewers"
        invitations.any? && invitations.all? { |item| item.decision == "approved" && item.decided_at && item.decided_at < item.expires_at } ? [] : ["Every invited reviewer must approve this version first"]
      when "manual"
        note = @attributes[:approval_note]
        note.is_a?(String) && note.strip.present? && note.length <= 4000 ? [] : ["Record the external approval evidence"]
      else
        ["Choose how approval was obtained"]
      end
    end

    def change(touch: true)
      @record.with_lock do
        revision = @record.current_revision
        unless @attributes[:lock_version].is_a?(Integer) && @attributes[:lock_version] == @record.lock_version &&
            @attributes[:revision_id] == revision.id && @attributes[:content_digest] == revision.content_digest
          raise SignatureRequest::Conflict, "This version changed. Reload before continuing the review."
        end
        unless %w[draft under_review changes_requested approved].include?(revision.status)
          raise SignatureRequest::Conflict, "This version is locked for signing."
        end
        result = yield revision
        @record.touch if touch
        @record.audits.create!(action: "review", user: @actor, associated: @record.company,
          audited_changes: { revision_id: revision.id, status: revision.status })
        result
      end
    end
end

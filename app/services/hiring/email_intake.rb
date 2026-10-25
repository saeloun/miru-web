# frozen_string_literal: true

module Hiring
  class EmailIntake
    def initialize(receipt)
      @receipt = receipt
      @company = receipt.company
    end

    def process
      @receipt.with_lock do
        next @receipt unless @receipt.state == "pending"

        unless @receipt.hiring_mailbox.active?
          @receipt.update!(state: "review", review_reason: "mailbox_disabled")
          next @receipt
        end

        content = EmailContent.new(@receipt.source)
        details = @receipt.details.merge(content.details)
        reason = content.review_reason
        @company.with_lock do
          previous = @company.hiring_receipts.where(message_key: content.key, state: "accepted")
            .where.not(id: @receipt.id).order(:id).first if content.key
          application = previous&.hiring_application || @company.hiring_applications.find_by(email_key: content.key) if content.key
          if application
            fingerprint = previous ? previous.details["fingerprint"] : application.creation_details["email_fingerprint"]
            reason = fingerprint == content.fingerprint ? nil : "message_content_changed"
          elsif reason.nil? || reason == "application_not_identified"
            application = referenced_application(content)
            reason = nil if application
          end

          new_application = !application && !reason
          application = create_application(content) if new_application
          @receipt.update!(state: reason ? "review" : "accepted", review_reason: reason,
            hiring_application: application, message_key: content.key, details:)
          Acknowledgement.new(receipt: @receipt).queue if new_application
        end
        @receipt
      end
    end

    private

      def referenced_application(content)
        content.references.reverse_each do |reference|
          key = content.key(reference)
          next unless key

          receipt = @company.hiring_receipts.where(message_key: key, state: "accepted").where.not(hiring_application_id: nil).first
          application = receipt&.hiring_application || @company.hiring_applications.find_by(email_key: key)
          return application if application
        end
        nil
      end

      def create_application(content)
        candidate = @company.hiring_candidates.create_or_find_by!(email: content.email) do |record|
          record.full_name = content.full_name
        end
        received_at = @company.hiring_receipts.where(message_key: content.key).minimum(:received_at)
        application = @company.hiring_applications.create!(hiring_candidate: candidate,
          source: "email", email_key: content.key, request_key: SecureRandom.uuid, received_at:,
          creation_details: { "full_name" => content.full_name, "email" => content.email,
            "email_fingerprint" => content.fingerprint })
        application.audits.create!(associated: @company, action: "create", audited_changes: {})
        application
      end
  end
end

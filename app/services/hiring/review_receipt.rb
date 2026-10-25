# frozen_string_literal: true

module Hiring
  class ReviewReceipt
    def initialize(company:, actor:, receipt:)
      @company, @actor, @receipt = company, actor, receipt
    end

    def accept!(full_name:, email:, lock_version:, application_id: nil, acknowledge: false)
      unless full_name.is_a?(String) && email.is_a?(String) && [true, false].include?(acknowledge) &&
          (application_id.nil? || application_id.is_a?(Integer) && application_id.positive?)
        raise Intake::InvalidInput, "Confirm the applicant name, one email address and a valid application."
      end
      candidate = @company.hiring_candidates.new(full_name:, email:)
      raise Intake::InvalidInput, "Confirm a valid applicant name and one email address." unless candidate.valid?

      with_receipt(lock_version:) do
        application = reviewed_application(candidate, application_id)
        details = @receipt.details.merge("reviewed_identity" => { "full_name" => candidate.full_name, "email" => candidate.email },
          "reviewed_reason" => @receipt.review_reason)
        @receipt.update!(state: "accepted", hiring_application: application, details:, review_reason: nil,
          reviewed_by: @actor, reviewed_at: Time.current)
        Acknowledgement.new(receipt: @receipt, actor: @actor).queue if acknowledge
      end
    end

    def dismiss!(lock_version:)
      with_receipt(lock_version:) { @receipt.update!(state: "dismissed", reviewed_by: @actor, reviewed_at: Time.current) }
    end

    def retry_processing!(lock_version:)
      with_receipt(lock_version:, state: "pending") do
        @receipt.audits.create!(associated: @company, user: @actor, action: "intake_retry_requested", audited_changes: {})
        ActiveRecord.after_all_transactions_commit do
          job = HiringIntakeJob.perform_later(@receipt.id)
          raise ActiveJob::EnqueueError unless job && job.successfully_enqueued?
        rescue ActiveJob::EnqueueError, SolidQueue::Job::EnqueueError
          raise ReceiveEmail::Unavailable, "Email processing could not be queued. Try again.", cause: nil
        end
      end
    end

    private

      def with_receipt(lock_version:, state: "review", &action)
        unless lock_version.is_a?(Integer) && lock_version >= 0
          raise Intake::InvalidInput, "Reload the email before continuing."
        end
        @actor.with_lock do
          unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).create?
            raise Pundit::NotAuthorizedError
          end
          @receipt.with_lock do
            raise Pundit::NotAuthorizedError unless @receipt.company_id == @company.id
            unless @receipt.lock_version == lock_version && @receipt.state == state
              raise Intake::Conflict, "This email changed or no longer allows this action. Reload its current status."
            end
            @company.with_lock { Audited.audit_class.as_user(@actor, &action) }
          end
        end
        @receipt
      end

      def reviewed_application(candidate, application_id)
        application_id ||= @receipt.hiring_application_id
        if application_id
          application = @company.hiring_applications.find(application_id)
          unless application.hiring_candidate.email == candidate.email
            raise Intake::InvalidInput, "The selected application must match the verified applicant email."
          end
          return application
        end

        key = Digest::SHA256.hexdigest(["review", candidate.email, @receipt.source_checksum].to_json)
        existing = @company.hiring_applications.find_by(email_key: key)
        return existing if existing

        person = @company.hiring_candidates.create_or_find_by!(email: candidate.email) { |record| record.full_name = candidate.full_name }
        received_at = @company.hiring_receipts.where(source_checksum: @receipt.source_checksum).minimum(:received_at)
        application = @company.hiring_applications.create!(hiring_candidate: person, source: "email", email_key: key,
          request_key: SecureRandom.uuid, received_at:, created_by: @actor,
          creation_details: { "full_name" => candidate.full_name, "email" => candidate.email,
            "email_fingerprint" => @receipt.details["fingerprint"] })
        application.audits.create!(associated: @company, user: @actor, action: "create", audited_changes: {})
        application
      end
  end
end

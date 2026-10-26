# frozen_string_literal: true

module Hiring
  class Assignments
    ISSUE_KEYS = %w[company_id application_version template_id template_version reviewer_employment_id due_at request_key candidate_note].freeze
    REVIEW_KEYS = %w[company_id application_version assignment_version submission_id outcome request_kind dimensions notes].freeze
    DECISION_KEYS = (ISSUE_KEYS + %w[assignment_version action reason review_id]).freeze

    def initialize(application:, actor:)
      @application, @actor = application, actor
      @company = application.company
    end

    def issue!(attributes:)
      with_actor do
        validate_attributes!(attributes, ISSUE_KEYS)
        existing_request(attributes) || issue_record!(attributes)
      end
    end

    def submit!(assignment:, token:, attributes:)
      @application.with_lock do
        assignment.with_lock do
          candidate_access!(assignment, token)
          validate_attributes!(attributes, %w[assignment_version submission_version answers], workspace: false)
          submission = assignment.submission
          if submission.submitted_at?
            raise Intake::Conflict, "Submitted work cannot be rewritten." unless submission.answers == attributes["answers"]

            return submission
          end
          version!(assignment, attributes["assignment_version"])
          version!(submission, attributes["submission_version"])
          raise Intake::InvalidInput, "Use valid submission answers." unless attributes["answers"].is_a?(Hash)

          submission.update!(answers: attributes["answers"], submitted_at: Time.current)
          assignment.update!(status: "submitted")
          update_stage!("assignment_review")
          assignment.record_event!("submitted", actor: nil)
          submission
        end
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Include your work, setup, explanation, own contribution and explicit AI-use disclosure."
    end

    def review!(assignment:, attributes:)
      with_actor(assignment:, reviewer: true) do
        validate_attributes!(attributes, REVIEW_KEYS)
        versions!(assignment, attributes)
        submission = assignment.submission
        unless identity(attributes["submission_id"]) == submission.id
          raise Intake::Conflict, "The submitted work changed. Reload before reviewing."
        end
        dimensions = attributes["dimensions"]
        outcome, kind = attributes.values_at("outcome", "request_kind")
        unless HiringAssignmentReview::OUTCOMES.include?(outcome) && HiringAssignmentReview::REQUEST_KINDS.include?(kind) &&
            dimensions.is_a?(Hash) && dimensions.keys.sort == HiringAssignmentReview::DIMENSIONS.sort && dimensions.values.all? { |value| text?(value, 5_000) }
          raise Intake::InvalidInput, "Record all six assessment dimensions, an outcome and a follow-up type."
        end
        notes = attributes["notes"]
        unless (notes.nil? || notes == "" || text?(notes)) &&
            (outcome == "clarification_required" ? kind != "none" && text?(notes) : kind == "none")
          raise Intake::InvalidInput, "Clarification requires a specific walkthrough, follow-up or revision request and instructions."
        end
        record = assignment.reviews.create!(company: @company, submission:, created_by: @actor, outcome:,
          review_round: assignment.review_round, assignment_version: assignment.lock_version + 1,
          details: { "dimensions" => dimensions, "request_kind" => kind, "notes" => notes, "reviewer_name" => @actor.full_name })
        assignment.update!(status: "reviewed")
        assignment.touch if assignment.lock_version < record.assignment_version
        @application.touch
        assignment.record_event!("reviewed", actor: @actor, details: { "review_id" => record.id, "outcome" => outcome, "request_kind" => kind })
        record
      end
    end

    def upload!(assignment:, token:, attributes:)
      blob = nil
      with_candidate(assignment, token) do
        submission = candidate_edit!(assignment, attributes, %w[assignment_version submission_version file])
        upload = attributes["file"]
        unless upload.is_a?(ActionDispatch::Http::UploadedFile) && upload.size.between?(1, HiringAssignmentSubmission::MAX_FILE_BYTES)
          raise Intake::InvalidInput, "Upload a file between 1 byte and 5 MiB."
        end
        unless submission.files.count < HiringAssignmentSubmission::MAX_FILES &&
            submission.files.sum { |file| file.blob.byte_size } + upload.size <= HiringAssignmentSubmission::MAX_TOTAL_BYTES
          raise Intake::InvalidInput, "Use at most five files and 20 MiB in total."
        end
        raise HiringSubmission::StorageUnavailable if ActiveStorage::Blob.service.public?

        name = upload.original_filename
        raise Intake::InvalidInput, "Use a valid file name." unless name.is_a?(String) && name.valid_encoding?

        name = File.basename(name.tr("\x00-\x1f\x7f", "-")).last(200)
        name = "submission" if name.blank? || %w[. ..].include?(name)
        blob = ActiveStorage::Blob.create_before_direct_upload!(filename: name, content_type: "application/octet-stream",
          byte_size: upload.size, checksum: Digest::MD5.file(upload.tempfile.path).base64digest,
          metadata: { identified: true, analyzed: true, hiring_assignment_submission_id: submission.id,
            hiring_company_id: @company.id, hiring_sha256: Digest::SHA256.file(upload.tempfile.path).hexdigest })
        upload.tempfile.rewind
        blob.upload(upload.tempfile, identify: false)
        candidate_access!(assignment, token)
        submission.files.attach(blob)
        submission.touch
        submission
      end
    rescue StandardError
      blob.persisted? ? blob.purge : blob.delete if blob && !blob.attachments.exists?
      raise
    end

    def remove_file!(assignment:, token:, attributes:)
      with_candidate(assignment, token) do
        submission = candidate_edit!(assignment, attributes, %w[assignment_version submission_version attachment_id])
        submission.files_attachments.find(identity(attributes["attachment_id"])).destroy!
        submission.reload.touch
        submission
      end
    end

    def candidate_file!(assignment:, token:, attachment_id:)
      with_candidate(assignment, token) do
        result = file_data(assignment, attachment_id)
        candidate_access!(assignment, token)
        result
      end
    end

    def reviewer_file!(assignment:, attachment_id:)
      with_actor(assignment:, reviewer: true) do
        result = file_data(assignment, attachment_id)
        raise Pundit::NotAuthorizedError unless HiringAssignmentPolicy.new(@actor.reload, assignment).review?

        result
      end
    end

    def admin_file!(assignment:, attachment_id:)
      with_actor(assignment:) { file_data(assignment, attachment_id) }
    end

    def reassign!(assignment:, attributes:)
      with_actor(assignment:) do
        validate_attributes!(attributes, %w[company_id application_version assignment_version reviewer_employment_id reason])
        versions!(assignment, attributes)
        reason!(attributes)
        reviewer = selected_reviewer(attributes)
        raise Intake::InvalidInput, "Choose a different reviewer." if assignment.reviewer_employment_id == reviewer.id

        before = assignment.reviewer_employment&.user&.full_name
        assignment.update!(reviewer_employment: reviewer, review_round: assignment.review_round + 1,
          status: assignment.submission.submitted_at? ? "submitted" : "issued")
        @application.touch
        assignment.record_event!("reassigned", actor: @actor, details: { "reason" => attributes["reason"],
          "before" => before, "after" => reviewer.user.full_name })
        assignment
      end
    end

    def decide!(assignment:, attributes:)
      with_actor(assignment:) do
        validate_attributes!(attributes, DECISION_KEYS)
        if attributes["action"] == "revise" && (existing = existing_request(attributes))
          next existing
        end
        versions!(assignment, attributes)
        reason!(attributes)
        latest = assignment.current_review
        unless optional_identity(attributes["review_id"]) == latest&.id
          raise Intake::Conflict, "The assessment review changed. Reload before deciding."
        end
        case attributes["action"]
        when "revise"
          raise Intake::InvalidInput, "Include instructions for the revised work." unless text?(attributes["candidate_note"])

          assignment.update!(status: "superseded", ended_at: Time.current)
          replacement = issue_record!(attributes, previous: assignment)
          assignment.record_event!("revised", actor: @actor, details: { "reason" => attributes["reason"], "replacement_id" => replacement.id })
          replacement
        when "advance", "reject"
          raise Intake::InvalidInput, "Record the designated review before deciding." unless latest

          assignment.update!(status: "completed", ended_at: Time.current)
          stage = attributes["action"] == "advance" ? "interview" : "rejection_pending"
          update_stage!(stage)
          assignment.record_event!(attributes["action"] == "advance" ? "advanced" : "rejection_pending", actor: @actor,
            details: { "reason" => attributes["reason"], "review_id" => latest.id })
          assignment
        when "cancel"
          assignment.update!(status: "cancelled", ended_at: Time.current)
          update_stage!(HiringAssignment::ACTIVE_STAGES.include?(@application.stage) ? "screening" : @application.stage)
          assignment.record_event!("cancelled", actor: @actor, details: { "reason" => attributes["reason"] })
          assignment
        else
          raise Intake::InvalidInput, "Choose a valid assessment decision."
        end
      end
    end

    private

      def with_candidate(assignment, token)
        @application.with_lock do
          assignment.with_lock do
            candidate_access!(assignment, token)
            yield
          end
        end
      end

      def candidate_edit!(assignment, attributes, keys)
        validate_attributes!(attributes, keys, workspace: false)
        submission = assignment.submission
        raise Intake::Conflict, "Submitted work cannot be rewritten." if submission.submitted_at?

        version!(assignment, attributes["assignment_version"])
        version!(submission, attributes["submission_version"])
        submission
      end

      def file_data(assignment, attachment_id)
        submission = assignment.submission
        attachment = submission.files_attachments.find(identity(attachment_id))
        { data: submission.file_bytes(attachment), filename: attachment.filename.to_s, type: "application/octet-stream" }
      end

      def with_actor(assignment: nil, reviewer: false, &operation)
        raise Pundit::NotAuthorizedError unless @actor

        @actor.with_lock do
          @company.with_lock do
            @application.with_lock do
              unless @actor.current_workspace_id == @company.id &&
                  (reviewer ? HiringAssignmentPolicy.new(@actor, assignment).review? : HiringPolicy.new(@actor, @application).update?)
                raise Pundit::NotAuthorizedError
              end
              if assignment
                assignment.with_lock do
                  unless assignment.company_id == @company.id && assignment.hiring_application_id == @application.id
                    raise Pundit::NotAuthorizedError
                  end
                  operation.call
                end
              else
                operation.call
              end
            end
          end
        end
      rescue ActiveRecord::RecordInvalid
        raise Intake::InvalidInput, "Use valid assessment details in this workspace."
      end

      def validate_attributes!(attributes, keys, workspace: true)
        raise Intake::InvalidInput, "Use valid assessment parameters." unless attributes.is_a?(Hash) && (attributes.keys - keys).empty?
        if workspace && identity(attributes["company_id"]) != @company.id
          raise Intake::Conflict, "The hiring workspace changed. Reload before saving."
        end
      end

      def versions!(assignment, attributes)
        version!(@application, attributes["application_version"])
        version!(assignment, attributes["assignment_version"])
        raise Intake::InvalidInput, "This assessment has ended." if assignment.ended_at?
        raise Intake::InvalidInput, "This application is closed." if HiringPortalAccess::CLOSED_STAGES.include?(@application.stage)
      end

      def version!(record, value)
        unless value.is_a?(Integer) && value >= 0 && value == record.lock_version
          raise Intake::Conflict, "This assessment changed. Reload before saving."
        end
      end

      def identity(value)
        return value.to_i if (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)

        raise Intake::InvalidInput, "Choose valid assessment identities."
      end

      def optional_identity(value) = value.nil? ? nil : identity(value)

      def text?(value, limit = 10_000)
        value.is_a?(String) && value.valid_encoding? && value.strip.present? && value.length <= limit &&
          !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
      end

      def reason!(attributes)
        raise Intake::InvalidInput, "Record the reason for this assessment change." unless text?(attributes["reason"])
      end

      def existing_request(attributes)
        key = attributes["request_key"]
        unless key.is_a?(String) && key.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/)
          raise Intake::InvalidInput, "Use a valid assessment request key."
        end
        existing = @company.hiring_assignments.find_by(request_key: key)
        return unless existing
        unless existing.hiring_application_id == @application.id && existing.issued_by_id == @actor.id && existing.request_details == attributes
          raise Intake::Conflict, "This request key already belongs to different assessment details. Review the saved work."
        end

        existing
      end

      def selected_reviewer(attributes)
        id = identity(attributes["reviewer_employment_id"])
        HiringPolicy.staff_members(@company).find_by(id:) || raise(Intake::InvalidInput, "Choose an active staff reviewer in this workspace.")
      end

      def deadline(value)
        unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})\z/)
          raise Intake::InvalidInput, "Choose a deadline with an explicit time zone."
        end
        time = DateTime.iso8601(value).to_time.utc
        raise Intake::InvalidInput, "Choose a future assessment deadline." unless time > Time.current

        time
      rescue Date::Error, ArgumentError
        raise Intake::InvalidInput, "Choose a valid future deadline with a time zone."
      end

      def issue_record!(attributes, previous: nil)
        version!(@application, attributes["application_version"])
        raise Intake::InvalidInput, "Reopen this application before issuing work." if HiringPortalAccess::CLOSED_STAGES.include?(@application.stage)
        raise Intake::InvalidInput, "Finish, cancel or revise the active assessment first." if @application.hiring_assignments.where(ended_at: nil).exists?

        template = @company.hiring_assignment_templates.find(identity(attributes["template_id"]))
        version!(template, attributes["template_version"])
        unless template.status == "approved" && template.complete? && (!template.hiring_role || template.hiring_role.status == "open")
          raise Intake::InvalidInput, "Approve complete current task terms and an open role before issuing work."
        end
        revision = template.revisions.find_by!(template_version: template.lock_version)
        note = attributes["candidate_note"]
        raise Intake::InvalidInput, "Use valid candidate instructions." unless note.nil? || note == "" || text?(note)

        reviewer = selected_reviewer(attributes)
        assignment = @application.hiring_assignments.create!(company: @company, template_revision: revision, issued_by: @actor,
          reviewer_employment: reviewer, previous_assignment: previous, request_key: attributes["request_key"], request_details: attributes,
          terms: revision.snapshot.except("actor_name"), candidate_note: note, due_at: deadline(attributes["due_at"]))
        assignment.create_submission!(company: @company, answers: {})
        update_stage!("assignment_assigned")
        assignment.record_event!("issued", actor: @actor, details: { "reviewer_name" => reviewer.user.full_name })
        assignment
      end

      def candidate_access!(assignment, token)
        unless assignment.company_id == @company.id && assignment.hiring_application_id == @application.id && assignment.candidate_access?(token)
          raise HiringAssignment::Unavailable
        end
      end

      def update_stage!(stage)
        Audited.audit_class.as_user(@actor) { @application.update!(stage:) }
        @application.touch if @application.saved_changes.empty?
      end
  end
end

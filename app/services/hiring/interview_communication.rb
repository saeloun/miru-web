# frozen_string_literal: true

module Hiring
  class InterviewCommunication
    KEYS = %w[company_id kind mailbox_id mailbox_version setting_version application_version interview_version booking_version recipient].freeze

    def initialize(booking:, actor:)
      @booking, @actor = booking, actor
      @interview = booking.hiring_interview
      @application = @interview.hiring_application
      @company = booking.company
    end

    def with_booking(&block)
      raise Pundit::NotAuthorizedError unless @actor

      @actor.with_lock do
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).create?
          raise Pundit::NotAuthorizedError
        end
        @company.with_lock("FOR NO KEY UPDATE") do
          @application.with_lock do
            @interview.with_lock do
              @booking.with_lock(&block)
            end
          end
        end
      end
    end

    def messages = @company.hiring_messages.where(hiring_application: @application, event_key: "booking:#{@booking.id}")

    def preview!(kind:, mailbox_id:)
      with_booking { current_preview(kind, mailbox_id) }
    end

    def queue!(attributes:, retry_of: nil, message_version: nil)
      with_booking do
        input!(attributes)
        existing = messages.operations.find_by(kind: attributes["kind"])
        if existing && !retry_of
          raise Intake::Conflict, "This booking message already has different confirmed intent. Review its history." unless existing.content["intent"] == attributes

          next [existing, false]
        end
        if retry_of
          current_message!(retry_of, message_version)
          unless retry_of.kind == attributes["kind"] && retry_of.retryable? && retry_of.attempts.order(attempt_number: :desc).first.id == retry_of.id
            raise Intake::Conflict, "Review the latest attempt and reconcile any unknown delivery before retrying."
          end
        end
        preview = current_preview(attributes["kind"], attributes["mailbox_id"])
        raise Intake::Conflict, "The recipient, approval, inbox or interview changed. Preview again before sending." unless preview.fetch("intent") == attributes

        message = Audited.audit_class.as_user(@actor) do
          messages.create!(kind: attributes["kind"], hiring_setting: HiringSetting.find_by!(company: @company), approved_setting_version: attributes.fetch("setting_version"),
            queued_by: @actor, content: preview.merge("actor_id" => @actor.id),
            original_message_id: retry_of && (retry_of.original_message_id || retry_of.id), attempt_number: retry_of ? retry_of.attempt_number + 1 : 1)
        end
        ActiveRecord.after_all_transactions_commit { message.enqueue }
        [message, true]
      end
    end

    def reconcile!(message:, message_version:, outcome:, evidence:, worker_stopped:)
      with_booking do
        current_message!(message, message_version)
        message.record_delivery_review!(actor: @actor, outcome:, evidence:, worker_stopped:)
      end
    end

    def self.available?(booking, kind)
      return booking.status == "cancelled" if kind == "interview_cancellation"
      return false unless booking.status == "scheduled" && booking.ends_at > Time.current && booking.hiring_interview.status == "planned"

      kind != "interview_reschedule" || booking.number > 1
    end

    def self.blocked_reason(message)
      intent = message.content["intent"]
      booking = HiringInterviewBooking.where(company: message.company).find_by(id: message.event_key.delete_prefix("booking:"))
      return "interview_unavailable" unless intent.is_a?(Hash) && booking && booking.hiring_interview.hiring_application_id == message.hiring_application_id

      interview = booking.hiring_interview
      application = interview.hiring_application
      return "interview_changed" unless available?(booking, message.kind) &&
        [application.lock_version, interview.lock_version, booking.lock_version] == intent.values_at("application_version", "interview_version", "booking_version")
      return if message.kind == "interview_cancellation"

      staff_ids = booking.panel_snapshot.pluck("employment_id")
      panel_ids = booking.panel_snapshot.pluck("panel_member_id").sort
      unless HiringPolicy.staff_members(message.company).where(id: staff_ids).count == staff_ids.uniq.size &&
          interview.hiring_access_grants.active.pluck(:hiring_panel_member_id).sort == panel_ids
        "panel_changed"
      end
    end

    private

      def input!(attributes)
        unless attributes.is_a?(Hash) && attributes.keys.sort == KEYS.sort && HiringMessage::INTERVIEW_KINDS.include?(attributes["kind"]) &&
            (KEYS - %w[kind recipient]).all? { |key| attributes[key].is_a?(Integer) && attributes[key] >= 0 } &&
            attributes["recipient"].is_a?(String) && attributes["recipient"].length <= 254 && attributes["company_id"] == @company.id
          raise Intake::InvalidInput, "Confirm the complete current message preview before sending."
        end
      end

      def current_message!(message, version)
        message.lock!
        raise Pundit::NotAuthorizedError unless messages.exists?(id: message.id)
        raise Intake::Conflict, "This delivery attempt changed. Reload its current status." unless version.is_a?(Integer) && version == message.lock_version
      end

      def current_preview(kind, mailbox_id)
        unless HiringMessage::INTERVIEW_KINDS.include?(kind) && mailbox_id.is_a?(Integer) && mailbox_id.positive?
          raise Intake::InvalidInput, "Choose an interview message and enabled reply inbox."
        end
        setting = HiringSetting.find_by(company: @company)
        mailbox = @company.hiring_mailboxes.find_by(id: mailbox_id, active: true)
        unless setting&.approved? && mailbox && self.class.available?(@booking, kind) && !%w[withdrawn rejected hired].include?(@application.stage)
          raise Intake::InvalidInput, "An approved template, enabled inbox and eligible interview are required."
        end
        subject, body = setting.details.values_at("#{kind}_subject", "#{kind}_body")
        unless [subject, body].all? { |text| text.is_a?(String) && text.strip.present? }
          raise Intake::InvalidInput, "Save and approve the subject and body for this interview message in communication settings."
        end

        intent = { "company_id" => @company.id, "kind" => kind, "mailbox_id" => mailbox.id, "mailbox_version" => mailbox.lock_version,
          "setting_version" => setting.lock_version, "application_version" => @application.lock_version, "interview_version" => @interview.lock_version,
          "booking_version" => @booking.lock_version, "recipient" => @application.hiring_candidate.reload.email }
        content = { "intent" => intent, "to" => intent.fetch("recipient"), "reply_to" => mailbox.source_email,
          "mailbox_id" => mailbox.id, "subject" => subject, "body" => [body, candidate_details(kind)].join("\n\n") }
        candidate_message = @company.hiring_messages.new(hiring_application: @application, kind:, event_key: "booking:#{@booking.id}", content:)
        raise Intake::Conflict, "The interview or assigned panel changed. Reload before sending." if self.class.blocked_reason(candidate_message)

        content
      end

      def candidate_details(kind)
        zone = @booking.details.fetch("candidate_time_zone")
        time_zone = TZInfo::Timezone.get(zone)
        start = time_zone.to_local(@booking.starts_at).strftime("%Y-%m-%d %H:%M:%S %:z")
        finish = time_zone.to_local(@booking.ends_at).strftime("%Y-%m-%d %H:%M:%S %:z")
        lines = ["Candidate: #{@application.submitted_name}", "Interview: #{@booking.round_details.fetch('title')}",
          "Duration: #{@booking.round_details.fetch('duration_minutes')} minutes", "Time: #{start} to #{finish} (#{zone})"]
        if kind == "interview_cancellation"
          lines << "This booking is cancelled. Reply to the hiring team for next steps."
        else
          lines += ["Interviewers: #{@booking.panel_snapshot.pluck('full_name').join(', ')}",
            "Preparation: #{@booking.round_details.fetch('preparation')}", "Meeting: #{@booking.details.fetch('meeting_url')}",
            "Booking and changes: #{@booking.details.fetch('booking_instructions')}"]
          @booking.panel_snapshot.each do |member|
            link = member.fetch("details", {})["booking_url"]
            lines << "Booking link — #{member.fetch('full_name')}: #{link}" if link.present?
          end
        end
        lines.join("\n")
      end
  end
end

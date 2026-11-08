# frozen_string_literal: true

module Hiring
  class Scheduling
    CREATE_KEYS = %w[company_id application_version interview_version request_key starts_local candidate_time_zone utc_offset
      meeting_url booking_instructions feedback_hours previous_booking_id reason].freeze
    END_KEYS = %w[company_id application_version interview_version booking_version action reason].freeze
    IMPORT_KEYS = %w[company_id application_version interview_version request_key calendar_id event_id etag candidate_time_zone
      feedback_hours booking_instructions previous_booking_id reason].freeze

    def initialize(interview:, actor:)
      @interview, @actor = interview, actor
      @application = interview.hiring_application
      @company = interview.company
    end

    def create!(attributes:)
      with_round do
        input!(attributes, CREATE_KEYS)
        existing = existing_request(attributes)
        next existing if existing
        versions!(attributes)
        available_round!
        record_booking!(attributes)
      end
    end

    def calendar_context
      with_round do
        available_round!
        import_context
      end
    end

    def import!(attributes:)
      prepared = with_round do
        prepare_import(attributes)
      end
      return prepared if prepared.is_a?(HiringInterviewBooking)

      event = yield prepared
      with_round do
        current = prepare_import(attributes)
        next current if current.is_a?(HiringInterviewBooking)

        raise Intake::Conflict, "The candidate or panel changed. Reload before importing." unless prepared == current
        raise Intake::Conflict, "The calendar event changed. Search again before importing." unless event.fetch("etag") == attributes["etag"]

        record_booking!(attributes, calendar_event: event)
      end
    end

    def end!(booking:, attributes:)
      with_round do
        booking.with_lock do
          input!(attributes, END_KEYS)
          versions!(attributes)
          version!(booking, attributes["booking_version"])
          available_round!
          unless booking.hiring_interview_id == @interview.id && booking.status == "scheduled"
            raise Intake::Conflict, "This booking changed. Reload its current status."
          end
          end_booking!(booking, attributes)
        end
      end
    end

    private

      def with_round
        raise Pundit::NotAuthorizedError unless @actor

        @actor.with_lock do
          @company.with_lock("FOR NO KEY UPDATE") do
            @application.with_lock do
              @interview.with_lock do
                unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @interview).update?
                  raise Pundit::NotAuthorizedError
                end
                yield
              end
            end
          end
        end
      rescue ActiveRecord::RecordInvalid, ActiveRecord::SerializationTypeMismatch
        raise Intake::InvalidInput, "Use valid booking details, a safe HTTPS meeting link and an explicit feedback deadline."
      end

      def input!(attributes, allowed)
        unless attributes.is_a?(Hash) && (attributes.keys - allowed).empty? && JSON.generate(attributes).bytesize <= 64.kilobytes
          raise Intake::InvalidInput, "Use valid interview booking parameters."
        end
        company_id = attributes["company_id"]
        unless (company_id.is_a?(String) || company_id.is_a?(Integer)) && company_id.to_s == @company.id.to_s
          raise Intake::Conflict, "The hiring workspace changed. Reload before saving."
        end
      end

      def versions!(attributes)
        version!(@application, attributes["application_version"])
        version!(@interview, attributes["interview_version"])
      end

      def version!(record, value)
        unless value.is_a?(Integer) && value >= 0 && value == record.lock_version
          raise Intake::Conflict, "This application, round or booking changed. Reload before saving."
        end
      end

      def available_round!
        unless @interview.status == "planned" && @application.stage == "interview"
          raise Intake::InvalidInput, "Record a booking for a planned interview round."
        end
        ids = @interview.panel_snapshot.map { |member| member.fetch("employment_id") }
        unless HiringPolicy.staff_members(@company).where(id: ids).count == ids.uniq.size
          raise Intake::InvalidInput, "Reassign inactive panel members before recording a booking."
        end
        panel_ids = @interview.panel_snapshot.pluck("panel_member_id").sort
        unless @interview.hiring_access_grants.active.pluck(:hiring_panel_member_id).sort == panel_ids
          raise Intake::InvalidInput, "Reassign the panel before recording a booking."
        end
      end

      def existing_request(attributes)
        key = attributes["request_key"]
        unless key.is_a?(String) && key.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i)
          raise Intake::InvalidInput, "Use a valid booking request identifier."
        end
        existing = @interview.hiring_interview_bookings.find_by(request_key: key)
        if existing && existing.request_details != attributes
          raise Intake::Conflict, "This request already recorded a different booking."
        end
        existing
      end

      def import_context
        ids = @interview.panel_snapshot.pluck("employment_id")
        { application_version: @application.lock_version, interview_version: @interview.lock_version,
          candidate_email: @application.hiring_candidate.reload.email.strip.downcase,
          panel_emails: @company.employments.where(id: ids).joins(:user).pluck("users.email").map { |email| email.strip.downcase }.sort,
          duration_minutes: @interview.details.fetch("duration_minutes") }
      end

      def prepare_import(attributes)
        input!(attributes, IMPORT_KEYS)
        existing = existing_request(attributes)
        return existing if existing

        versions!(attributes)
        available_round!
        import_context
      end

      def record_booking!(attributes, calendar_event: nil)
        original = @interview.hiring_interview_bookings.scheduled.first
        replace_booking!(original, attributes)
        starts_at = if calendar_event
          Time.iso8601(calendar_event.fetch("starts_at"))
        else
          InterviewTime.parse(attributes["starts_local"], time_zone: attributes["candidate_time_zone"], utc_offset: attributes["utc_offset"])
        end
        hours = attributes["feedback_hours"]
        raise Intake::InvalidInput, "Choose a feedback deadline from 1 to 8,760 hours after the interview." unless hours.is_a?(Integer) && hours.between?(1, 8760)

        ends_at = starts_at + @interview.details.fetch("duration_minutes").minutes
        booking = @interview.hiring_interview_bookings.create!(company: @company, created_by: @actor,
          number: (@interview.hiring_interview_bookings.maximum(:number) || 0) + 1, request_key: attributes.fetch("request_key"), request_details: attributes,
          starts_at:, ends_at:, feedback_due_at: ends_at + hours.hours, details: booking_details(attributes, starts_at, calendar_event:),
          round_details: @interview.details, panel_snapshot: @interview.panel_snapshot)
        event!(booking, original ? "rescheduled" : "scheduled")
        booking
      end

      def replace_booking!(original, attributes)
        previous = attributes["previous_booking_id"]
        unless (previous.nil? && original.nil?) || original && (previous.is_a?(String) || previous.is_a?(Integer)) && previous.to_s == original.id.to_s
          raise Intake::Conflict, "The current booking changed. Reload before rescheduling."
        end
        reason = reason!(attributes, required: original.present?)
        original&.end!(status: "cancelled", reason:)
      end

      def booking_details(attributes, starts_at, calendar_event: nil)
        zone = attributes["candidate_time_zone"]
        raise Intake::InvalidInput, "Choose the candidate's IANA time zone." unless zone.is_a?(String) && zone.valid_encoding? && zone.length <= 100

        local = TZInfo::Timezone.get(zone).to_local(starts_at)
        result = { "starts_local" => attributes["starts_local"], "candidate_time_zone" => zone,
          "utc_offset" => local.strftime("%:z"),
          "meeting_url" => attributes.fetch("meeting_url", ""), "booking_instructions" => attributes.fetch("booking_instructions", ""),
          "feedback_hours" => attributes["feedback_hours"], "source" => "manual" }
        if calendar_event
          result.merge!("source" => "google_calendar", "starts_local" => local.strftime("%Y-%m-%dT%H:%M:%S.%6N"),
            "meeting_url" => calendar_event.fetch("meeting_url"), "provider" => attributes.slice("calendar_id", "event_id", "etag")
              .merge("starts_at" => calendar_event.fetch("starts_at"), "ends_at" => calendar_event.fetch("ends_at")))
        end
        result
      rescue TZInfo::InvalidTimezoneIdentifier
        raise Intake::InvalidInput, "Choose the candidate's IANA time zone."
      end

      def reason!(attributes, required: true)
        value = attributes["reason"]
        unless value.nil? || value.is_a?(String) && value.valid_encoding? && value.length <= 2000 && !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
          raise Intake::InvalidInput, "Use a valid booking reason of at most 2,000 characters."
        end
        reason = value&.strip.presence
        if required && reason.nil?
          raise Intake::InvalidInput, "Record the reason for changing this booking."
        end
        reason
      end

      def end_booking!(booking, attributes)
        action = attributes["action"]
        unless %w[cancel no_show].include?(action)
          raise Intake::InvalidInput, "Choose cancellation or no-show."
        end
        if action == "no_show" && booking.starts_at > Time.current
          raise Intake::InvalidInput, "Record a no-show only after the scheduled start."
        end
        booking.end!(status: action == "cancel" ? "cancelled" : "no_show", reason: reason!(attributes))
        event!(booking, action == "cancel" ? "booking_cancelled" : "no_show")
        booking
      end

      def event!(booking, action)
        @interview.touch
        @application.touch
        @interview.events.create!(company: @company, created_by: @actor, action:, interview_version: @interview.lock_version,
          application_version: @application.lock_version,
          details: { "actor_name" => @actor.full_name, "booking" => booking.admin_details.deep_stringify_keys })
      end
  end
end

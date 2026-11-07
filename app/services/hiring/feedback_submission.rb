# frozen_string_literal: true

module Hiring
  class FeedbackSubmission
    KEYS = %w[company_id application_version interview_version booking_version feedback_version request_key details].freeze

    def initialize(feedback:, actor:)
      @feedback, @actor = feedback, actor
      @booking = feedback.hiring_interview_booking
      @interview = @booking.hiring_interview
      @application = @interview.hiring_application
      @company = feedback.company
    end

    def details
      with_feedback { response_details }
    end

    def submit!(attributes:)
      with_feedback do
        input!(attributes)
        if @feedback.submitted_at
          unless @feedback.request_details == attributes
            raise Intake::Conflict, "This feedback was already submitted with different intent."
          end
          next response_details
        end
        [@application, @interview, @booking, @feedback].zip(%w[application_version interview_version booking_version feedback_version]).each do |record, key|
          value = attributes[key]
          raise Intake::Conflict, "This interview or feedback request changed. Reload before submitting." unless value.is_a?(Integer) && value >= 0 && value == record.lock_version
        end
        raise Intake::InvalidInput, "Record feedback only after the scheduled interview start." unless @feedback.ready?

        @feedback.update!(details: attributes["details"], request_key: attributes["request_key"], request_details: attributes,
          submitted_by: @actor, submitted_at: Time.current)
        record_event!
        response_details
      end
    rescue ActiveRecord::RecordInvalid, ActiveRecord::SerializationTypeMismatch
      raise Intake::InvalidInput, "Complete the actual date, attendance, assessment, examples, questions and recommendation."
    end

    private

      def with_feedback
        raise Pundit::NotAuthorizedError unless @actor

        @actor.with_lock do
          @company.with_lock("FOR NO KEY UPDATE") do
            @application.with_lock do
              @interview.with_lock do
                @booking.with_lock do
                  @feedback.with_lock do
                    raise Pundit::NotAuthorizedError unless HiringFeedbackPolicy.new(@actor, @feedback).show?

                    yield
                  end
                end
              end
            end
          end
        end
      end

      def input!(attributes)
        unless attributes.is_a?(Hash) && (attributes.keys - KEYS).empty? && JSON.generate(attributes).bytesize <= 1.megabyte
          raise Intake::InvalidInput, "Use valid feedback parameters."
        end
        identity = attributes["company_id"]
        unless (identity.is_a?(Integer) || identity.is_a?(String)) && identity.to_s == @company.id.to_s
          raise Intake::Conflict, "The hiring workspace changed. Reload before submitting."
        end
      end

      def record_event!
        @application.touch
        @interview.touch
        @interview.events.create!(company: @company, created_by: @actor, action: "feedback_submitted",
          application_version: @application.lock_version, interview_version: @interview.lock_version,
          details: { "actor_name" => @actor.full_name, "feedback_id" => @feedback.id, "booking_id" => @booking.id,
            "attendance" => @feedback.details.fetch("attendance"), "recommendation" => @feedback.details.fetch("recommendation") })
      end

      def response_details
        review = @feedback.review_details
        { company_id: @company.id, candidate_name: @application.submitted_name,
          application_version: @application.lock_version, interview_version: @interview.lock_version, booking_version: @booking.lock_version,
          feedback: review.slice(:id, :lock_version, :state, :submitted_at, :details, :reviewer_name, :late).merge(can_submit: @feedback.ready?),
          booking: review.fetch(:booking), round: review.fetch(:round) }
      end
  end
end

# frozen_string_literal: true

module Hiring
  class CalendarEvents
    class Unavailable < StandardError; end

    def initialize(client:, context:)
      @service = Google::Apis::CalendarV3::CalendarService.new
      @service.authorization = client
      @service.client_options.open_timeout_sec = 5
      @service.client_options.read_timeout_sec = 15
      @context = context
    end

    def calendars(page_token: nil)
      token!(page_token)
      with_provider do
        page = @service.list_calendar_lists(max_results: 20, page_token:)
        { calendars: Array(page.items).map { |row| { id: row.id, name: row.summary.to_s.first(200) } }, next_page_token: page.next_page_token }
      end
    end

    def events(calendar_id:, from:, page_token: nil)
      identity!(calendar_id)
      token!(page_token)
      unless from.is_a?(String) && from.match?(/\A\d{4}-\d{2}-\d{2}\z/) && Date.iso8601(from).iso8601 == from
        raise Intake::InvalidInput, "Choose a valid UTC search date."
      end
      day = Date.iso8601(from)
      start = Time.utc(day.year, day.month, day.day)
      with_provider do
        page = @service.list_events(calendar_id, max_results: 20, page_token:, single_events: true, order_by: "startTime",
          time_min: start.iso8601, time_max: (start + 7.days).iso8601)
        matches = Array(page.items).filter_map do |event|
          normalize(event)
        rescue Intake::InvalidInput
          nil
        end
        { events: matches, next_page_token: page.next_page_token }
      end
    rescue Date::Error
      raise Intake::InvalidInput, "Choose a valid UTC search date."
    end

    def fetch(calendar_id:, event_id:)
      identity!(calendar_id)
      identity!(event_id)
      with_provider do
        event = @service.get_event(calendar_id, event_id)
        raise Intake::InvalidInput, "The calendar returned a different event." unless event.id == event_id

        normalize(event)
      end
    end

    private

      def normalize(event)
        unless %w[confirmed tentative].include?(event.status) && !event.attendees_omitted && !event.end_time_unspecified &&
            event.recurrence.blank? && event.start&.date.nil? && event.end&.date.nil? && event.start&.date_time && event.end&.date_time
          raise Intake::InvalidInput, "Choose a dated meeting instance with its full attendee list."
        end
        starts = event.start.date_time.to_time.utc
        ends = event.end.date_time.to_time.utc
        unless [starts, ends].all? { |time| (time.to_r * 1_000_000).denominator == 1 } && ends - starts == @context.fetch(:duration_minutes).minutes
          raise Intake::InvalidInput, "Choose an event matching the round duration, with at most microsecond time precision."
        end
        attendees!(event)
        identity!(event.id)
        identity!(event.etag)
        { "id" => event.id, "etag" => event.etag, "summary" => event.summary.to_s.first(200),
          "starts_at" => starts.iso8601(6), "ends_at" => ends.iso8601(6),
          "meeting_url" => event.hangout_link || event.conference_data&.entry_points&.find { |entry| entry.entry_point_type == "video" }&.uri || "" }
      end

      def attendees!(event)
        attendees = Array(event.attendees)
        declined = attendees.filter_map { |person| person.email.to_s.strip.downcase if person.response_status == "declined" }
        present = attendees.filter_map do |person|
          person.email.to_s.strip.downcase if %w[accepted tentative needsAction].include?(person.response_status)
        end
        present << event.organizer.email.to_s.strip.downcase if event.organizer
        required = [@context.fetch(:candidate_email)] + @context.fetch(:panel_emails)
        unless (required - present).empty? && (required & declined).empty?
          raise Intake::InvalidInput, "The candidate and every assigned interviewer must be included and not declined."
        end
      end

      def identity!(value)
        unless value.is_a?(String) && value.valid_encoding? && value.present? && value.length <= 1024 && !value.match?(/[[:cntrl:]]/)
          raise Intake::InvalidInput, "Choose a valid calendar event."
        end
      end

      def token!(value)
        identity!(value) unless value.nil?
      end

      def with_provider
        yield
      rescue Google::Apis::AuthorizationError, Google::Auth::AuthorizationError, Signet::AuthorizationError
        raise Calendars::Connection::Disconnected
      rescue Google::Apis::Error => error
        raise ActiveRecord::RecordNotFound if [404, 410].include?(error.status_code)
        raise Unavailable if error.status_code.nil? || error.status_code == 429 || error.status_code >= 500

        raise Intake::InvalidInput, "This calendar or event is unavailable to the connected account."
      rescue JSON::ParserError, TypeError, ArgumentError
        raise Intake::InvalidInput, "The calendar returned invalid event details."
      end
  end
end

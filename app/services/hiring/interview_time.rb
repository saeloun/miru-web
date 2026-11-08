# frozen_string_literal: true

module Hiring
  class InterviewTime
    FORMAT = "%Y-%m-%dT%H:%M"

    class Ambiguous < Intake::InvalidInput
      attr_reader :offsets

      def initialize(offsets)
        @offsets = offsets
        super("This local time occurs twice. Choose the UTC offset #{offsets.join(' or ')}.")
      end
    end

    class << self
      def parse(value, time_zone:, utc_offset: nil)
        unless time_zone.is_a?(String) && time_zone.valid_encoding? && time_zone.length.between?(1, 100)
          raise Intake::InvalidInput, "Choose a valid candidate IANA time zone."
        end
        zone = TZInfo::Timezone.get(time_zone)
        local = wall_time(value)
        local - period_offset(zone.periods_for_local(local), utc_offset)
      rescue TZInfo::InvalidTimezoneIdentifier
        raise Intake::InvalidInput, "Choose a valid candidate IANA time zone."
      end

      private

        def wall_time(value)
          unless value.is_a?(String) && value.valid_encoding? && value.match?(/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\z/)
            raise Intake::InvalidInput, "Use a local date and time in YYYY-MM-DDTHH:MM format."
          end
          parsed = DateTime.strptime(value, FORMAT)
          raise Intake::InvalidInput, "Choose a real date and time." unless parsed.strftime(FORMAT) == value

          Time.utc(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute)
        rescue Date::Error
          raise Intake::InvalidInput, "Choose a real date and time."
        end

        def period_offset(periods, requested)
          raise Intake::InvalidInput, "This local time does not exist in the selected time zone." if periods.empty?

          offsets = periods.map(&:observed_utc_offset)
          raise Ambiguous, offsets.map { |offset| format_offset(offset) } if offsets.many? && requested.nil?

          selected = requested.nil? ? offsets.sole : parse_offset(requested)
          raise Intake::InvalidInput, "Choose an offset valid for this local time and time zone." unless offsets.include?(selected)

          selected
        end

        def parse_offset(value)
          unless value.is_a?(String) && value.valid_encoding? && value.match?(/\A[+-]\d{2}:[0-5]\d\z/)
            raise Intake::InvalidInput, "Choose a valid UTC offset."
          end
          seconds = value[1, 2].to_i * 3600 + value[4, 2].to_i * 60
          value.start_with?("-") ? -seconds : seconds
        end

        def format_offset(value)
          format("%s%02d:%02d", value.negative? ? "-" : "+", value.abs / 3600, value.abs % 3600 / 60)
        end
    end
  end
end

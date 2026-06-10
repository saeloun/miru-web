# frozen_string_literal: true

module QuickBooks
  module Mappers
    class Base
      private

        def compact_payload(value)
          case value
          when Hash
            value.each_with_object({}) do |(key, nested_value), payload|
              compacted_value = compact_payload(nested_value)
              payload[key] = compacted_value unless blank_payload_value?(compacted_value)
            end
          when Array
            value.map { |nested_value| compact_payload(nested_value) }.reject { |nested_value| blank_payload_value?(nested_value) }
          else
            value
          end
        end

        def money(value)
          BigDecimal(value.to_s).round(2).to_f
        end

        def quantity(value)
          BigDecimal(value.to_s).round(4).to_f
        end

        def qbo_date(value)
          value&.to_date&.iso8601
        end

        def truncate(value, limit)
          value.to_s.strip.first(limit)
        end

        def blank_payload_value?(value)
          value.nil? ||
            value == "" ||
            (value.respond_to?(:empty?) && !value.is_a?(FalseClass) && !value.is_a?(TrueClass) && value.empty?)
        end
    end
  end
end

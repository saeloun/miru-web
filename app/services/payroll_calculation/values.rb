# frozen_string_literal: true

require "bigdecimal"
require "date"
require "json"

module PayrollCalculation
  module Values
    def decimal(value, field, negative: false)
      unless value.is_a?(String) && value.match?(/\A-?\d+(?:\.\d+)?\z/) && value.length <= 80
        raise ArgumentError, "#{field} must be a decimal string"
      end
      amount = BigDecimal(value)
      raise ArgumentError, "#{field} must be nonnegative" if !negative && amount.negative?

      amount
    end

    def text(value, field)
      raise ArgumentError, "#{field} is required" unless value.is_a?(String) && !value.strip.empty?

      value
    end

    def currency(value)
      raise ArgumentError, "currency must be an uppercase three-letter code" unless value.is_a?(String) && value.match?(/\A[A-Z]{3}\z/)

      value
    end

    def schema(object, allowed, field)
      raise ArgumentError, "#{field} must be an object" unless object.is_a?(Hash)
      raise ArgumentError, "#{field} has unsupported fields" unless (object.keys - allowed).empty?
    end

    def immutable(value)
      case value
      when Hash
        value.to_h { |key, item| [text(key, "key").dup.freeze, immutable(item)] }.freeze
      when Array then value.map { |item| immutable(item) }.freeze
      when String then value.dup.freeze
      when Integer, TrueClass, FalseClass, NilClass then value
      else raise ArgumentError, "unsupported value type"
      end
    end

    def formatted(value)
      value.to_s("F")
    end

    def date(value)
      raise ArgumentError, "date must be ISO8601" unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

      Date.iso8601(value)
    end
  end
end

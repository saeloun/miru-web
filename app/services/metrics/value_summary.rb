# frozen_string_literal: true

module Metrics
  class ValueSummary
    class << self
      def build(metric_type, data)
        value_sum, value_count =
          case metric_type.to_s
          when "hours_logged"
            [data["total_minutes"] || 0, data["entry_count"] || 0]
          when "invoice_summary", "client_revenue"
            [data["total_amount"] || data["total_revenue"] || 0, data["count"] || data["invoice_count"] || 0]
          when "outstanding_amounts"
            [data["total_outstanding"] || 0, data["overdue_count"] || 0]
          else
            [data["total_value"] || 0, data["count"] || 0]
          end

        {
          value_sum:,
          value_count:,
          value_avg: average(value_sum, value_count)
        }
      end

      private

        def average(value_sum, value_count)
          return nil unless value_count.to_f.positive? && value_sum.to_f.positive?

          value_sum / value_count
        end
    end
  end
end

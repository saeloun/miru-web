# frozen_string_literal: true

module LeaveTypeValidatable
  extend ActiveSupport::Concern

  included do
    validate :valid_allocation_combination
    validate :valid_allocation_value
    validate :valid_carry_forward
  end

  private

    def valid_allocation_combination
      if allocation_period == "weeks" && allocation_frequency == "per_week"
        errors.add(:base, "Invalid combination: Allocation period in weeks cannot have frequency per week")
      end

      if allocation_period == "months" && !(allocation_frequency == "per_quarter" || allocation_frequency == "per_year")
        errors.add(
          :base,
          "Invalid combination: Allocation period in months can only have frequency per quarter or per year")
      end
    end

    def valid_allocation_value
      max_values = {
        ["days", "per_week"] => 7,
        ["days", "per_month"] => 31,
        ["days", "per_quarter"] => 92,
        ["days", "per_year"] => 366,
        ["weeks", "per_month"] => 5,
        ["weeks", "per_quarter"] => 13,
        ["weeks", "per_year"] => 52,
        ["months", "per_quarter"] => 3,
        ["months", "per_year"] => 12
      }

      if allocation_value.present?
        key = [allocation_period, allocation_frequency]
        if max_values[key] && allocation_value > max_values[key]
          errors.add(
            :allocation_value,
            "cannot exceed #{max_values[key]} #{allocation_period} for #{allocation_frequency} frequency")
        end
      end
    end

    def valid_carry_forward
      total_days = convert_allocation_to_days

      if carry_forward_days.present? && total_days.present? && carry_forward_days > total_days
        errors.add(:carry_forward_days, "cannot exceed the total allocated days")
      end
    end

    def convert_allocation_to_days
      return nil unless allocation_value

      base_days = case allocation_period
                  when "days"
                    allocation_value
                  when "weeks"
                    allocation_value * 7
                  when "months"
                    allocation_value * 31
                  else
                    return nil
      end

      case allocation_frequency
      when "per_week"
        base_days * 52
      when "per_month"
        base_days * 12
      when "per_quarter"
        base_days * 4
      when "per_year"
        base_days
      else
        nil
      end
    end
end

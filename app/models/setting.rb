# frozen_string_literal: true

# RailsSettings Model
class Setting < RailsSettings::Base
  cache_prefix { "v1" }
  TIME_INTERVAL = %i[min hr]

  # Define your fields
  field :number_of_email, type: :integer, default: "5"
  field :interval_length, type: :integer, default: "5"
  field :interval_unit,
    default: :min,
    validates: { presence: true, inclusion: { in: TIME_INTERVAL } },
    option_values: TIME_INTERVAL

  def self.current_inteval_start_timestamp
    current_time = Time.current

    interval = if interval_unit == :min
      interval_length.minutes
    else
      interval_length.hours
    end

    current_time - interval
  end
end

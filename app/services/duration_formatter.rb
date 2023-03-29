# frozen_string_literal: true

# Formats the duration passed in minutes to HH:MM format
class DurationFormatter < ApplicationService
  attr_reader :duration

  def initialize(duration)
    @duration = duration
  end

  def process
    total_minutes = duration.to_i
    hours = total_minutes / 60
    minutes = total_minutes % 60
    format("%02d:%02d", hours, minutes)
  end
end

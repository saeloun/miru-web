# frozen_string_literal: true

class FormatDuration < ApplicationService
  attr_reader :duration

  def initialize(duration)
    @duration = duration
  end

  def process
    total_seconds = duration.to_i
    minutes = (total_seconds / 60) % 60
    hours = total_seconds / (60 * 60)
    format("%02d:%02d", hours, minutes)
  end
end

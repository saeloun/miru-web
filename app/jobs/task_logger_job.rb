# frozen_string_literal: true

class TaskLoggerJob < ApplicationJob
  queue_as :default

  def perform(*args)
    # Do something later
    puts "Sidekiq JOb executed"
  end
end

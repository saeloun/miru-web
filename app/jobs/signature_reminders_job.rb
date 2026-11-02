# frozen_string_literal: true

class SignatureRemindersJob < ApplicationJob
  queue_as :default

  def perform
    Signatures::Operations.queue_due_reminders
  end
end

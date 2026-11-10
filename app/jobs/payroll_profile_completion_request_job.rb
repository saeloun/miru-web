# frozen_string_literal: true

class PayrollProfileCompletionRequestJob < ApplicationJob
  def perform(id)
    raise ActiveRecord::ActiveRecordError, "Profile requests require committed records" if PayrollProfileCompletionRequest.connection.transaction_open?
    request = PayrollProfileCompletionRequest.find_by(id:)
    return unless request

    mail = claim(request)
    return unless mail

    mail.deliver_now
    unless mail.message.perform_deliveries
      mark_delivery_failure(request)
      return
    end
    request.with_lock { request.update!(state: "sent", sent_at: Time.current) if request.state == "sending" }
  rescue StandardError
    mark_delivery_failure(request) if request
    Rails.logger.warn("Payroll profile-completion delivery requires review")
  end

  private

    def mark_delivery_failure(request)
      request.with_lock do
        case request.state
        when "queued" then request.update!(state: "failed")
        when "sending" then request.update!(state: "uncertain")
        end
      end
    rescue StandardError
      # Recovery retries queued work and holds a stale sending row without resending.
      nil
    end

    def claim(request)
      request.payroll_run.with_lock do
        request.employment.with_lock do
          request.with_lock do
            next unless request.state == "queued"
            source = Payroll::ProfileCompletion.new(request.payroll_run).current_source(request.employment)
            unless request.delivery_eligible? && source[:source_digest] == request.source_digest && source[:categories] == request.categories
              request.update!(state: "skipped")
              next
            end
            mail = PayrollProfileCompletionMailer.requested(request.id)
            message = mail.message
            next unless message.perform_deliveries

            message.raise_delivery_errors = true
            request.update!(state: "sending", attempted_at: Time.current)
            mail
          end
        end
      end
    end
end

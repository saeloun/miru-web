# frozen_string_literal: true

class AdminAlertMailer < ApplicationMailer
  def zerobounce_circuit_open(circuit_data)
    failures = circuit_data[:failures] || []
    @failures_count = failures.count
    @opened_at = circuit_data[:opened_at]
    @last_error = failures.last&.[](:error)
    @recent_failures = failures.last(5)

    mail(
      to: ENV["ADMIN_EMAIL"] || ENV["DEFAULT_MAILER_SENDER"],
      subject: "[ALERT] Zerobounce Email Validation Disabled"
    )
  end
end

# frozen_string_literal: true

class AdminAlertMailer < ApplicationMailer
  def zerobounce_circuit_open(circuit_data)
    @failures_count = circuit_data[:failures].count
    @opened_at = circuit_data[:opened_at]
    @last_error = circuit_data[:failures].last[:error]
    @recent_failures = circuit_data[:failures].last(5)

    mail(
      to: ENV["ADMIN_EMAIL"] || ENV["DEFAULT_MAILER_SENDER"],
      subject: "[ALERT] Zerobounce Email Validation Disabled"
    )
  end
end

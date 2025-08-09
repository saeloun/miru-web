# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"]
  layout "mailer"

  def current_user
    @current_user ||= User.find_by(id: params[:current_user_id])
  end

  def email_rate_limiter
    return nil unless current_user

    @email_rate_limiter ||= current_user.email_rate_limiter
  end

  def email_within_rate_limit
    return if email_rate_limiter.nil? || current_user.nil?
    return true unless rate_within_time_limit

    rate_within_time_limit && email_sent_within_limit
  end

  def raise_email_limit_crossed_error
    raise "Email Limit crossed" unless email_within_rate_limit
  end

  def update_email_rate_limiter
    if rate_within_time_limit
      if email_rate_limiter.current_interval_started_at.nil?
        email_rate_limiter.current_interval_started_at = Time.current
      end
      email_rate_limiter.number_of_emails_sent = @email_rate_limiter.number_of_emails_sent + 1
      email_rate_limiter.save
    else
      email_rate_limiter.update(number_of_emails_sent: 1, current_interval_started_at: Time.current)
    end
  end

  def rate_within_time_limit
    email_rate_limiter.current_interval_started_at &&
      (Setting.current_interval_start_timestamp < email_rate_limiter.current_interval_started_at)
  end

  def email_sent_within_limit
    email_rate_limiter.number_of_emails_sent < Setting.number_of_email
  end
end

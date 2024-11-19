# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  append_view_path Rails.root.join("app", "views", "mailers")
  default from: ENV["DEFAULT_MAILER_SENDER"]
  layout "mailer"

  def set_current_user
    @current_user ||= User.find_by(id: params[:current_user_id])
  end

  def email_rate_limiter
    @email_rate_limiter ||= @current_user.email_rate_limiter
  end

  def email_within_rate_limit
    set_current_user
    return if email_rate_limiter.nil?
    raise "Not a valid User record" if @current_user.nil?

    if rate_within_time_limit
      # Passes when the current interval start timestamp is earlier than the user's last email interval reset time.
      # Condition: (current time - global interval length) < user's email reset timestamp
      # Example:
      # X = (current time - global interval length) = (6:25 PM - 5.minutes) = 6:20 PM
      # Y = user's email reset timestamp = 6:21 PM
      # Result: 6:20 PM (X) < 6:21 PM (Y) = True

      email_sent_within_limit
    else
      # When the user's last email interval reset time is greater then send email
      true
    end
  end

  def raise_email_limit_crossed_error
    raise "Email Limit crossed" unless email_within_rate_limit
  end

  def update_email_rate_limiter
    if rate_within_time_limit
      if email_rate_limiter.current_interval_started_at.nil?
        email_rate_limiter.current_interval_started_at = Time.current
      end
      # Update the count of emails sent in the rate limiter, as this email was sent within the current rate limit interval.
      email_rate_limiter.number_of_emails_sent = @email_rate_limiter.number_of_emails_sent + 1
      email_rate_limiter.save
    else
      # Reset the email rate limiter and set the new time interval started at time.
      email_rate_limiter.update(number_of_emails_sent: 1, current_interval_started_at: Time.current)
    end
  end

  def rate_within_time_limit
    email_rate_limiter.current_interval_started_at &&
      (Setting.current_inteval_start_timestamp < email_rate_limiter.current_interval_started_at)
  end

  def email_sent_within_limit
    email_rate_limiter.number_of_emails_sent < Setting.number_of_email
  end
end

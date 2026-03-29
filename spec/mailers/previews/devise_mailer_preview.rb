# frozen_string_literal: true

require_relative "preview_support"

class DeviseMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def confirmation_instructions
    Devise::Mailer.confirmation_instructions(sample_user, "preview-confirmation-token", {})
  end

  def reset_password_instructions
    Devise::Mailer.reset_password_instructions(sample_user, "preview-reset-token", {})
  end

  def unlock_instructions
    Devise::Mailer.unlock_instructions(sample_user, "preview-unlock-token", {})
  end

  def email_changed
    Devise::Mailer.email_changed(sample_user, {})
  end

  def password_change
    Devise::Mailer.password_change(sample_user, {})
  end
end

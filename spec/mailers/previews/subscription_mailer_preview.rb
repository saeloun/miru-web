# frozen_string_literal: true

require_relative "preview_support"

class SubscriptionMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def trial_started
    company = sample_company
    company.update!(trial_ends_at: 30.days.from_now) if company.trial_ends_at.blank?

    SubscriptionMailer.with(company_id: company.id, recipient_id: sample_user.id).trial_started
  end
end

# frozen_string_literal: true

class SyncStripeSubscriptionCompanyJob < ApplicationJob
  queue_as :billing_sync

  def perform(company_id)
    company = Company.where.not(stripe_customer_id: [nil, ""]).find_by(id: company_id)
    return if company.blank?

    Subscriptions::StripeSyncService.process(company:)
  end
end

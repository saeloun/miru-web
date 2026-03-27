# frozen_string_literal: true

class SyncStripeSubscriptionsJob < ApplicationJob
  queue_as :default

  def perform
    companies.find_each do |company|
      SyncStripeSubscriptionCompanyJob.perform_later(company.id)
    end
  end

  private

    def companies
      Company.where.not(stripe_customer_id: [nil, ""])
    end
end

# frozen_string_literal: true

class RefreshRazorpayOauthTokensJob < ApplicationJob
  queue_as :default

  def perform
    return unless ENV["RAZORPAY_OAUTH_ENABLED"] == "true"

    PaymentsProvider.where(name: "razorpay", connected: true).
      where("settings @> ?", { authentication_mode: "oauth", oauth_status: "connected" }.to_json).find_each do |provider|
      PaymentProviders::RazorpayOauthConnection.new(provider:, actor: nil).access_token
    rescue PaymentProviders::RazorpayOauthConnection::RefreshInProgress
      next
    rescue PaymentProviders::RazorpayOauthConnection::Error => error
      Rails.error.report(error, handled: true, context: { payments_provider_id: provider.id, company_id: provider.company_id,
        recovery: "Review the workspace's Razorpay connection in Payment Settings before retrying." })
    end
  end
end

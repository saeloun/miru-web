# frozen_string_literal: true

class HubspotIntegrationJob < ApplicationJob
  queue_as :default

  def perform(email, first_name, last_name)
    hubspot_integration = HubspotIntegrationService.new(email, first_name, last_name)
    hubspot_integration.process
  end
end

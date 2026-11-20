# frozen_string_literal: true

require "net/http"

module Analytics
  class PosthogCaptureJob < ApplicationJob
    self.enqueue_after_transaction_commit = true

    retry_on StandardError, wait: :polynomially_longer, attempts: 5

    def self.capture(name, properties, user_id: nil)
      return if ENV["POSTHOG_PROJECT_TOKEN"].blank? || ENV["POSTHOG_HOST"].blank?

      properties = PosthogPrivacy.properties(properties)
      user_id ||= properties[:user_id]
      company_id = properties[:company_id] || Current.company&.id
      distinct_id = user_id ? "miru:user:#{user_id}" : ("miru:company:#{company_id}" if company_id)
      return unless distinct_id

      properties[:company_id] = company_id if company_id
      timestamp = Time.current.iso8601(6)
      ActiveRecord.after_all_transactions_commit do
        perform_later(name, distinct_id, properties, timestamp)
      rescue StandardError => error
        Rails.error.report(error, handled: true)
      end
    rescue StandardError => error
      Rails.error.report(error, handled: true)
    end

    def perform(name, distinct_id, properties, timestamp)
      return if ENV["POSTHOG_PROJECT_TOKEN"].blank? || ENV["POSTHOG_HOST"].blank?

      uri = URI.join(ENV.fetch("POSTHOG_HOST"), "/i/v0/e/")
      unless uri.is_a?(URI::HTTPS)
        raise ArgumentError, "POSTHOG_HOST must be an HTTPS instance URL; correct it and restart web and worker, or unset it to disable PostHog"
      end

      properties = PosthogPrivacy.properties(properties)
      properties[:$groups] = { company: "miru:company:#{properties[:company_id]}" } if properties[:company_id]
      properties[:$process_person_profile] = true
      request = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
      request.body = {
        api_key: ENV.fetch("POSTHOG_PROJECT_TOKEN"), event: name, uuid: job_id,
        distinct_id:, properties:, timestamp:
      }.to_json
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 3, read_timeout: 5) do |http|
        http.request(request)
      end
      unless response.is_a?(Net::HTTPSuccess)
        raise "PostHog capture failed (HTTP #{response.code}); check collector health, POSTHOG_HOST and POSTHOG_PROJECT_TOKEN. " \
          "Delivery retries up to 5 attempts with the same event UUID."
      end
    end
  end
end

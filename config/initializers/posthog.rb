# frozen_string_literal: true

if ENV["POSTHOG_HOST"].present? && ENV["POSTHOG_PROJECT_TOKEN"].present?
  unless URI.parse(ENV.fetch("POSTHOG_HOST")).is_a?(URI::HTTPS)
    raise ArgumentError, "POSTHOG_HOST must be an HTTPS instance URL; correct it and restart web and worker, or unset it to disable PostHog"
  end

  PostHog::Rails.configure do |config|
    config.auto_capture_exceptions = true
    config.report_rescued_exceptions = true
    config.auto_instrument_active_job = true
    config.use_tracing_headers = false
    config.current_user_resolver = lambda do |controller|
      user = controller.send(:current_user) if controller.respond_to?(:current_user, true)
      { "id" => "miru:user:#{user.id}" } if user
    end
    config.logs_enabled = true
    config.logs_forward_rails_logger = false
    config.logs_notifications = %i[action_controller active_record active_job action_mailer]
    config.logs_level = :debug
    config.logs_before_send = ->(record) { Analytics::PosthogPrivacy.log(record) }
  end

  PostHog.init do |config|
    config.api_key = ENV.fetch("POSTHOG_PROJECT_TOKEN")
    config.host = ENV.fetch("POSTHOG_HOST")
    config.test_mode = Rails.env.test?
    config.before_send = ->(event) { Analytics::PosthogPrivacy.event(event) }
  end
end

Rails.application.config.after_initialize do
  Rails.event.subscribe(Analytics::PosthogSubscriber.new)
  if PostHog::Rails.config&.auto_instrument_active_job
    Analytics::PosthogCaptureJob.posthog_distinct_id lambda { |_event, distinct_id, *_rest|
      Analytics::PosthogPrivacy.user_identity(distinct_id)
    }
  end
end

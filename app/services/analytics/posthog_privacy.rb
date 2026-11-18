# frozen_string_literal: true

module Analytics
  class PosthogPrivacy
    EVENT_PROPERTIES = (PosthogCaptureJob::PROPERTIES.map(&:to_s) + %w[
      $exception_list $exception_level $exception_source
      $controller $action $response_status_code $feature_flag $feature_flag_response
    ]).freeze
    LOG_ATTRIBUTES = %w[event.name rails.controller rails.action http.request.method http.response.status_code
      db.operation.name rails.sql.cached rails.job.class rails.job.queue rails.job.executions rails.job.priority
      rails.job.retry_wait rails.mailer error.type].freeze

    def self.event(event)
      properties = event.fetch(:properties, {}).stringify_keys.slice(*EVENT_PROPERTIES)
      if properties["$exception_list"]
        properties["$exception_list"] = properties["$exception_list"].map do |exception|
          exception = exception.stringify_keys
          frames = Array(exception.dig("stacktrace", "frames")).map do |frame|
            frame.stringify_keys.slice("filename", "function", "lineno", "in_app", "platform")
          end
          exception.slice("type").merge(
            "mechanism" => exception.fetch("mechanism", {}).slice("type", "handled", "synthetic", "exception_id", "parent_id", "source"),
            "value" => "[redacted]", "stacktrace" => { "type" => "raw", "frames" => frames }
          )
        end
      end
      identity = event[:distinct_id].to_s
      identified = identity.match?(/\Amiru:user:\d+\z/)
      event.merge(distinct_id: identified ? identity : "miru:backend",
        properties: properties.merge("$process_person_profile" => identified))
    end

    def self.log(record)
      attributes = record.fetch(:attributes, {}).stringify_keys.slice(*LOG_ATTRIBUTES)
      return unless attributes["event.name"]

      attributes["posthogDistinctId"] = "miru:user:#{Current.user.id}" if Current.user
      attributes["miru.company_id"] = Current.company.id if Current.company
      record.merge(body: "Miru #{attributes.fetch('event.name')}", attributes:)
    end
  end
end

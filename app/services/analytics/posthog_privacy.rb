# frozen_string_literal: true

module Analytics
  class PosthogPrivacy
    PROPERTIES = %i[company_id user_id client_id project_id invoice_id payment_id invitation_id
      billing_interval seat_quantity provider source sign_in_method status from to role
      utm_source utm_medium utm_campaign utm_term utm_content].freeze
    UNSAFE_VALUE = /@|%40|:\/\/|\A\/|(?:token|password|api[_-]?key|secret)\s*[:=]|\bbearer\s|[[:cntrl:]]/i
    EVENT_PROPERTIES = (PROPERTIES.map(&:to_s) + %w[
      $exception_list $exception_level $exception_source
      $controller $action $response_status_code $feature_flag $feature_flag_response
    ]).freeze
    LOG_ATTRIBUTES = %w[event.name rails.controller rails.action http.request.method http.response.status_code
      db.operation.name rails.sql.cached rails.job.class rails.job.queue rails.job.executions rails.job.priority
      rails.job.retry_wait rails.mailer error.type].freeze

    def self.event(event)
      properties = event.fetch(:properties, {}).stringify_keys.slice(*EVENT_PROPERTIES)
      properties.reject! { |key, value| key != "$exception_list" && !safe_value?(value) }
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
      identity = user_identity(event[:distinct_id])
      event.merge(distinct_id: identity || "miru:backend",
        properties: properties.merge("$process_person_profile" => identity.present?))
    end

    def self.properties(properties)
      properties.symbolize_keys.slice(*PROPERTIES).select { |_, value| safe_value?(value) }
    end

    def self.safe_value?(value)
      case value
      when String, Symbol
        value.to_s.length <= 255 && !UNSAFE_VALUE.match?(value.to_s)
      when Numeric
        !value.respond_to?(:finite?) || value.finite?
      when TrueClass, FalseClass
        true
      else
        false
      end
    end

    def self.user_identity(value)
      value.to_s if value.to_s.match?(/\Amiru:user:\d+\z/)
    end

    def self.log(record)
      incoming = record.fetch(:attributes, {}).stringify_keys
      attributes = incoming.slice(*LOG_ATTRIBUTES)
      return unless attributes["event.name"]

      identity = Current.user ? "miru:user:#{Current.user.id}" : user_identity(incoming["posthogDistinctId"])
      attributes["posthogDistinctId"] = identity if identity
      attributes["miru.company_id"] = Current.company.id if Current.company
      record.merge(body: "Miru #{attributes.fetch('event.name')}", attributes:)
    end
  end
end

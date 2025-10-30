# frozen_string_literal: true

class ZerobounceCircuitBreaker
  CACHE_KEY = "zerobounce_circuit_breaker"
  FAILURE_THRESHOLD = 10
  FAILURE_WINDOW = 2.hours
  CIRCUIT_OPEN_DURATION = 30.minutes
  TIMEOUT_SECONDS = 5

  class << self
    # Check if circuit breaker is open (validation disabled)
    def open?
      circuit_data = Rails.cache.read(CACHE_KEY)
      return false unless circuit_data
      return false unless circuit_data[:state] == "open"
      return false unless circuit_data[:opened_at]

      # Circuit is open if it was opened recently (within CIRCUIT_OPEN_DURATION)
      circuit_data[:opened_at] > CIRCUIT_OPEN_DURATION.ago
    end

    # Execute Zerobounce validation with circuit breaker protection
    def execute(email)
      return { skip: true, reason: "Circuit breaker open" } if open?
      return { skip: true, reason: "Email validation disabled" } unless validation_enabled?

      begin
        response = Timeout.timeout(TIMEOUT_SECONDS) do
          Zerobounce.validate(email)
        end

        record_success
        { success: true, response: }
      rescue Timeout::Error => e
        handle_failure("Timeout after #{TIMEOUT_SECONDS} seconds", e)
      rescue StandardError => e
        handle_failure("API error: #{e.message}", e)
      end
    end

    # Record successful API call
    def record_success
      Rails.cache.delete(CACHE_KEY)
    end

    # Record failed API call and check if circuit should open
    def record_failure(error_message)
      circuit_data = Rails.cache.read(CACHE_KEY) || initialize_circuit_data

      # Ensure failures is an array
      circuit_data[:failures] ||= []
      circuit_data[:failures] << { timestamp: Time.current, error: error_message }

      # Keep only failures within the time window
      circuit_data[:failures].select! { |f| f[:timestamp] > FAILURE_WINDOW.ago }

      if circuit_data[:failures].count >= FAILURE_THRESHOLD && circuit_data[:state] == "closed"
        open_circuit(circuit_data)
      end

      Rails.cache.write(CACHE_KEY, circuit_data, expires_in: FAILURE_WINDOW + CIRCUIT_OPEN_DURATION)
    end

    # Get current circuit breaker status
    def status
      circuit_data = Rails.cache.read(CACHE_KEY)
      return { state: "closed", failures: 0 } unless circuit_data

      {
        state: circuit_data[:state],
        failures: circuit_data[:failures].count,
        opened_at: circuit_data[:opened_at],
        last_failure: circuit_data[:failures].last
      }
    end

    # Manually reset circuit breaker
    def reset!
      Rails.cache.delete(CACHE_KEY)
    end

    private

      def validation_enabled?
        ENV["ENABLE_EMAIL_VALIDATION"] == "true"
      end

      def initialize_circuit_data
        {
          state: "closed",
          failures: [],
          opened_at: nil
        }
      end

      def open_circuit(circuit_data)
        circuit_data[:state] = "open"
        circuit_data[:opened_at] = Time.current

        Rails.logger.error("[ZerobounceCircuitBreaker] Circuit opened after #{FAILURE_THRESHOLD} failures")

        # Send admin notification
        notify_admin(circuit_data)
      end

      def handle_failure(error_message, exception)
        Rails.logger.warn("[ZerobounceCircuitBreaker] #{error_message}")
        record_failure(error_message)

        { skip: true, reason: error_message, error: exception }
      end

      def notify_admin(circuit_data)
        Rails.logger.error(
          "[ZerobounceCircuitBreaker] ALERT: Zerobounce validation disabled due to #{circuit_data[:failures].count} failures. " \
          "Last error: #{circuit_data[:failures].last[:error]}"
        )

        # Send email notification to admin only if ADMIN_EMAIL is set
        admin_email = ENV["ADMIN_EMAIL"]

        if admin_email.present?
          begin
            AdminAlertMailer.zerobounce_circuit_open(circuit_data).deliver_later
          rescue StandardError => e
            Rails.logger.error("[ZerobounceCircuitBreaker] Failed to send admin notification: #{e.message}")
          end
        else
          Rails.logger.info("[ZerobounceCircuitBreaker] ADMIN_EMAIL not set, skipping email notification")
        end
      end
  end
end

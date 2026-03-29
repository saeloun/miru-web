# frozen_string_literal: true

module Analytics
  class TrackingService
    attr_reader :user, :ahoy

    def initialize(user: nil, ahoy: nil)
      @user = user
      @ahoy = ahoy || (user ? Ahoy::Tracker.new(user: user) : Ahoy::Tracker.new)
    end

    # User Activity Events
    def track_login(metadata = {})
      track_event("user_login", metadata.merge(
        user_id: user&.id,
        email: user&.email,
        login_time: Time.current
      ))
    end

    def track_logout(metadata = {})
      track_event("user_logout", metadata.merge(
        user_id: user&.id,
        logout_time: Time.current
      ))
    end

    def track_page_view(page, metadata = {})
      track_event("page_view", metadata.merge(
        page: page,
        user_id: user&.id,
        viewed_at: Time.current
      ))
    end

    # Invoice Events (extending existing)
    def track_invoice_created(invoice, metadata = {})
      track_event("invoice_created", metadata.merge(
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        currency: invoice.currency,
        base_amount: invoice.base_currency_amount,
        exchange_rate: invoice.exchange_rate,
        client_id: invoice.client_id,
        user_id: user&.id
      ))
    end

    def track_invoice_sent(invoice, recipients, metadata = {})
      track_event("invoice_sent", metadata.merge(
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        recipients: recipients,
        sent_at: Time.current,
        user_id: user&.id
      ))
    end

    def track_invoice_viewed(invoice, metadata = {})
      track_event("invoice_viewed", metadata.merge(
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        viewer_ip: metadata[:ip],
        viewed_at: Time.current
      ))
    end

    def track_invoice_paid(invoice, payment, metadata = {})
      track_event("invoice_paid", metadata.merge(
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        payment_id: payment.id,
        amount: payment.amount,
        payment_currency: payment.payment_currency,
        base_amount: payment.base_currency_amount,
        exchange_rate: payment.exchange_rate,
        payment_method: payment.transaction_type,
        user_id: user&.id
      ))
    end

    # Payment Events
    def track_payment_created(payment, metadata = {})
      track_event("payment_created", metadata.merge(
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        amount: payment.amount,
        currency: payment.payment_currency,
        base_amount: payment.base_currency_amount,
        exchange_rate: payment.exchange_rate,
        transaction_type: payment.transaction_type,
        user_id: user&.id
      ))
    end

    def track_payment_failed(payment, error, metadata = {})
      track_event("payment_failed", metadata.merge(
        payment_id: payment&.id,
        invoice_id: payment&.invoice_id,
        amount: payment&.amount,
        error: error,
        user_id: user&.id
      ))
    end

    # Currency Conversion Events
    def track_currency_conversion(from_currency, to_currency, amount, rate, metadata = {})
      track_event("currency_conversion", metadata.merge(
        from_currency: from_currency,
        to_currency: to_currency,
        amount: amount,
        rate: rate,
        converted_amount: amount * rate,
        conversion_date: Date.current,
        user_id: user&.id
      ))
    end

    def track_exchange_rate_fetched(from_currency, to_currency, rate, source, metadata = {})
      track_event("exchange_rate_fetched", metadata.merge(
        from_currency: from_currency,
        to_currency: to_currency,
        rate: rate,
        source: source,
        fetched_at: Time.current
      ))
    end

    def track_exchange_rate_failed(from_currency, to_currency, error, metadata = {})
      track_event("exchange_rate_failed", metadata.merge(
        from_currency: from_currency,
        to_currency: to_currency,
        error: error,
        failed_at: Time.current
      ))
    end

    # Client Events
    def track_client_created(client, metadata = {})
      track_event("client_created", metadata.merge(
        client_id: client.id,
        client_name: client.name,
        currency: client.currency,
        user_id: user&.id
      ))
    end

    def track_client_updated(client, changes, metadata = {})
      track_event("client_updated", metadata.merge(
        client_id: client.id,
        client_name: client.name,
        changes: changes,
        user_id: user&.id
      ))
    end

    # Project Events
    def track_project_created(project, metadata = {})
      track_event("project_created", metadata.merge(
        project_id: project.id,
        project_name: project.name,
        client_id: project.client_id,
        billable: project.billable,
        user_id: user&.id
      ))
    end

    def track_time_entry_created(entry, metadata = {})
      track_event("time_entry_created", metadata.merge(
        entry_id: entry.id,
        project_id: entry.project_id,
        duration: entry.duration,
        work_date: entry.work_date,
        user_id: entry.user_id
      ))
    end

    # Report Events
    def track_report_generated(report_type, params, metadata = {})
      track_event("report_generated", metadata.merge(
        report_type: report_type,
        parameters: params,
        generated_at: Time.current,
        user_id: user&.id
      ))
    end

    def track_report_exported(report_type, format, metadata = {})
      track_event("report_exported", metadata.merge(
        report_type: report_type,
        export_format: format,
        exported_at: Time.current,
        user_id: user&.id
      ))
    end

    # Analytics Dashboard Events
    def track_analytics_viewed(section, metadata = {})
      track_event("analytics_viewed", metadata.merge(
        section: section,
        viewed_at: Time.current,
        user_id: user&.id,
        super_admin: user&.super_admin?
      ))
    end

    # Search Events
    def track_search(query, results_count, search_type, metadata = {})
      track_event("search_performed", metadata.merge(
        query: query,
        results_count: results_count,
        search_type: search_type,
        user_id: user&.id
      ))
    end

    # Error Events
    def track_error(error_type, error_message, context = {})
      track_event("error_occurred", context.merge(
        error_type: error_type,
        error_message: error_message,
        occurred_at: Time.current,
        user_id: user&.id
      ))
    end

    # Performance Events
    def track_slow_request(controller, action, duration, metadata = {})
      track_event("slow_request", metadata.merge(
        controller: controller,
        action: action,
        duration_ms: duration,
        user_id: user&.id
      ))
    end

    private

      def track_event(name, properties = {})
        # Filter out nil values and ensure proper data types
        clean_properties = properties.reject { |_, v| v.nil? }

        # Track with Ahoy
        ahoy.track(name, clean_properties)

        # Log for debugging in development
        Rails.logger.info("[Analytics] Event: #{name}, Properties: #{clean_properties}") if Rails.env.development?

        # You can also send to other analytics services here
        # Example: Segment.track(user_id: user&.id, event: name, properties: clean_properties)

        true
      rescue => e
        Rails.logger.error("[Analytics] Failed to track event #{name}: #{e.message}")
        false
      end
  end
end

# frozen_string_literal: true

module PaymentProviders
  # Holds every signed captured payment Miru could not settle on its invoice, one entry per payment.
  # It never settles or reopens an invoice. An owner reconciles each entry in Razorpay and clears it;
  # clearing the last one on an open invoice closes the tracked link so the customer can use a new one.
  class RazorpayPaymentReview
    LIMIT = 20
    REVIEWS_KEY = "razorpay_payment_reviews"
    LEGACY_REVIEW_KEY = "razorpay_payment_review"
    RESOLVED_KEY = "razorpay_resolved_payment_review_ids"

    class << self
      def flag!(invoice, payment_id:, payment_link_id:, amount:, reason:, currency: nil)
        review_id = review_id_for(payment_id, payment_link_id)
        invoice.with_lock do
          reviews = reviews_for(invoice)
          next if reviews.key?(review_id) || known?(invoice, review_id)

          reviews.delete(review_id_for(nil, payment_link_id))
          reviews[review_id] = { "payment_id" => payment_id, "payment_link_id" => payment_link_id,
            "amount" => amount.is_a?(Integer) && amount >= 0 ? amount : nil,
            "currency" => currency, "reason" => reason, "flagged_at" => Time.current.to_i }
          write(invoice, reviews)
          Audited::Audit.create!(auditable: invoice, associated: invoice.company, action: "razorpay_oauth_payment_needs_review",
            audited_changes: { "payment_id" => payment_id, "payment_link_id" => payment_link_id, "reason" => reason })
          Rails.logger.error("[Razorpay] captured payment needs review invoice_id=#{invoice.id} reason=#{reason}")
        end
      end

      def flag_link_captures!(invoice, payment_link, reason:)
        captures = RazorpayPaymentLinkVerification.new(invoice:, payment_link:, account_id: invoice.razorpay_payment_link_account_id).captured_payments
        if captures.empty? && %w[paid partially_paid].include?(payment_link["status"])
          flag!(invoice, payment_id: nil, payment_link_id: payment_link["id"], amount: nil, reason:, currency: payment_link["currency"])
        end
        captures.each do |payment|
          flag!(invoice, payment_id: payment["payment_id"], payment_link_id: payment_link["id"], amount: payment["amount"], reason:,
            currency: payment_link["currency"])
        end
      end

      # A review raised before the payment settled, such as from a mismatched callback, is no longer open money.
      def discharge_settled!(invoice, payment_id)
        invoice.with_lock do
          reviews = reviews_for(invoice)
          placeholder = reviews.delete(review_id_for(nil, invoice.razorpay_payment_link_id))
          review = reviews.delete(payment_id) || placeholder
          next unless review

          write(invoice, reviews)
          Audited::Audit.create!(auditable: invoice, associated: invoice.company, action: "razorpay_oauth_payment_review_settled",
            audited_changes: review.slice("payment_id", "payment_link_id", "reason"))
        end
      end

      def pending_for(company)
        # Oldest first and deleted invoices included, so clearing entries reveals any beyond the limit.
        company.invoices.where("payment_infos ->> '#{REVIEWS_KEY}' IS NOT NULL OR payment_infos ->> '#{LEGACY_REVIEW_KEY}' IS NOT NULL")
          .order(:id).limit(LIMIT)
          .flat_map { |invoice| reviews_for(invoice).map { |review_id, review| present(invoice, review_id, review) } }
          .first(LIMIT)
      end

      def resolve!(company, invoice_id, review_id, actor:)
        invoice = company.invoices.find(invoice_id)
        binding = with_authorized_actor(actor, company) { invoice.with_lock { link_to_close(invoice, review_id) } }
        status = RazorpayPaymentLinkCancellation.new(invoice:, **binding).process if binding
        with_authorized_actor(actor, company) do
          invoice.with_lock { finish_resolution(invoice, review_id, actor, binding, status) }
        end
      end

      def pending?(invoice, review_id = nil)
        reviews = reviews_for(invoice)
        review_id ? reviews.key?(review_id) : reviews.any?
      end

      def resolved?(invoice, payment_id)
        Array((invoice.payment_infos || {})[RESOLVED_KEY]).include?(payment_id)
      end

      def closed_reason(invoice)
        return "invoice_deleted" if invoice.discarded?
        return "invoice_waived" if invoice.waived?

        "invoice_paid" if invoice.paid?
      end

      # Reads the per-payment entries, folding in the singular review written by earlier code.
      def reviews_for(invoice)
        infos = invoice.payment_infos || {}
        reviews = infos[REVIEWS_KEY].is_a?(Hash) ? infos[REVIEWS_KEY].deep_dup : {}
        legacy = infos[LEGACY_REVIEW_KEY]
        reviews[review_id_for(legacy["payment_id"], legacy["payment_link_id"])] ||= legacy if legacy.is_a?(Hash)
        reviews
      end

      private

        def with_authorized_actor(actor, company)
          actor.with_lock do
            raise RazorpayOauthConnection::Error, "Razorpay connection access denied" unless RazorpayConnectionPolicy.new(actor, company).manage?

            yield
          end
        end

        def review_id_for(payment_id, payment_link_id)
          payment_id.presence || "link:#{payment_link_id}"
        end

        def known?(invoice, review_id)
          infos = invoice.payment_infos || {}
          Array(infos[RESOLVED_KEY]).include?(review_id) || infos["razorpay_payment_id"] == review_id ||
            Array(infos["razorpay_processed_payment_ids"]).include?(review_id) ||
            invoice.payments.exists?(provider_event_id: "razorpay:#{review_id}")
        end

        def present(invoice, review_id, review)
          currency = review.fetch("currency", invoice.currency)
          amount = review["amount"]
          unit = Money::Currency.find(currency) if currency.is_a?(String)
          display_amount = Money.from_cents(amount, unit).format(symbol: false, thousands_separator: "", decimal_mark: ".") if amount.is_a?(Integer) && amount >= 0 && unit
          { review_id:, invoice_id: invoice.id, invoice_number: invoice.invoice_number, invoice_state: closed_reason(invoice)&.delete_prefix("invoice_") || "open",
            payment_id: review["payment_id"], payment_link_id: review["payment_link_id"], reason: review["reason"],
            currency:, amount:, display_amount: }
        end

        def link_to_close(invoice, review_id)
          reviews = reviews_for(invoice)
          raise ActiveRecord::RecordNotFound unless reviews.key?(review_id) || resolved?(invoice, review_id)
          return unless reviews.keys == [review_id] && closed_reason(invoice).nil?

          { payment_link_id: invoice.razorpay_payment_link_id, account_id: invoice.razorpay_payment_link_account_id } if invoice.razorpay_payment_link_id.present?
        end

        def finish_resolution(invoice, review_id, actor, closed_binding, closed_status)
          reviews = reviews_for(invoice)
          review = reviews.delete(review_id)
          return if review.nil?

          changes = { RESOLVED_KEY => Array(invoice.payment_infos[RESOLVED_KEY]) | [review_id] }
          tracked_link_id = invoice.razorpay_payment_link_id.presence
          if reviews.empty? && tracked_link_id && closed_reason(invoice).nil?
            # Two owners cleared the last entries together, so neither closed the link. Keep this one for a retry.
            unless closed_binding == { payment_link_id: tracked_link_id, account_id: invoice.razorpay_payment_link_account_id }
              raise RazorpayClient::Error, "Razorpay payment link was not closed"
            end

            changes.merge!("razorpay_payment_link_id" => nil, "razorpay_payment_link_url" => nil, "razorpay_payment_link_status" => closed_status)
          end
          write(invoice, reviews, changes)
          Audited::Audit.create!(auditable: invoice, associated: invoice.company, user: actor, action: "razorpay_oauth_payment_review_resolved",
            audited_changes: review.slice("payment_id", "payment_link_id", "reason"))
        end

        # The invoice may be paid, deleted or otherwise no longer valid, and evidence must still be saved.
        def write(invoice, reviews, changes = {})
          infos = (invoice.payment_infos || {}).except(LEGACY_REVIEW_KEY, REVIEWS_KEY).merge(changes)
          infos[REVIEWS_KEY] = reviews if reviews.any?
          invoice.update_columns(payment_infos: infos, updated_at: Time.current)
        end
    end
  end
end

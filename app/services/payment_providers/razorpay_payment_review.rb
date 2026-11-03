# frozen_string_literal: true

module PaymentProviders
  # Holds a captured payment Miru could not match to its invoice. It never settles the invoice;
  # an owner reconciles it and clears it, which lets the customer pay through a new link.
  class RazorpayPaymentReview
    LIMIT = 20

    def self.flag!(invoice, payment_id:, payment_link_id:, amount:, reason:)
      return if invoice.razorpay_payment_review.present?

      invoice.update!(razorpay_payment_review: { "payment_id" => payment_id, "payment_link_id" => payment_link_id, "amount" => amount, "reason" => reason })
      Audited::Audit.create!(auditable: invoice, associated: invoice.company, action: "razorpay_oauth_payment_needs_review",
        audited_changes: { "payment_id" => payment_id, "payment_link_id" => payment_link_id, "reason" => reason })
      Rails.logger.error("[Razorpay] captured payment needs review invoice_id=#{invoice.id} reason=#{reason}")
    end

    def self.pending_for(company)
      company.invoices.kept.where.not(status: :paid).where("payment_infos ->> 'razorpay_payment_review' IS NOT NULL").limit(LIMIT).map do |invoice|
        { invoice_id: invoice.id, invoice_number: invoice.invoice_number, currency: invoice.currency, amount: invoice.razorpay_payment_review["amount"] }
      end
    end

    def self.resolve!(company, invoice_id, actor:)
      invoice = company.invoices.kept.find(invoice_id)
      invoice.with_lock do
        review = invoice.razorpay_payment_review
        next if review.blank?

        invoice.update!(razorpay_payment_review: nil, razorpay_payment_link_id: nil, razorpay_payment_link_url: nil)
        Audited::Audit.create!(auditable: invoice, associated: company, user: actor, action: "razorpay_oauth_payment_review_resolved",
          audited_changes: review.slice("payment_id", "payment_link_id", "reason"))
      end
    end
  end
end

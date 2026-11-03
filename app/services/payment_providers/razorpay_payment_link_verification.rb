# frozen_string_literal: true

module PaymentProviders
  class RazorpayPaymentLinkVerification
    def self.amount_subunits(invoice)
      (invoice.amount_due.to_d * Money::Currency.new(invoice.currency).subunit_to_unit).round.to_i
    end

    def initialize(invoice:, payment_link:, account_id:)
      @invoice = invoice
      @payment_link = payment_link
      @account_id = account_id
    end

    def reusable?
      bound_to_invoice? && amount == self.class.amount_subunits(@invoice)
    end

    def bound_to_invoice?
      belongs_to_invoice? && @payment_link["currency"] == @invoice.currency
    end

    def belongs_to_invoice?
      notes = @payment_link["notes"]
      @account_id.present? && @invoice.razorpay_payment_link_account_id == @account_id &&
        @payment_link["id"] == @invoice.razorpay_payment_link_id &&
        notes.is_a?(Hash) && notes["miru_invoice_id"] == @invoice.id.to_s && notes["company_id"] == @invoice.company_id.to_s &&
        @payment_link["reference_id"].to_s.start_with?("miru-inv-#{@invoice.id}-")
    end

    def captured_payment_id
      captured_payments.first&.fetch("payment_id")
    end

    def captured_payments
      Array(@payment_link["payments"]).select { |payment| payment.is_a?(Hash) && payment["status"] == "captured" && payment["payment_id"].present? }
    end

    def fully_paid?
      reusable? && @payment_link["status"] == "paid" && @payment_link["amount_paid"] == amount
    end

    def captured?(payment_id)
      fully_paid? && Array(@payment_link["payments"]).any? do |payment|
        payment.is_a?(Hash) && payment["payment_id"] == payment_id && payment["status"] == "captured" && payment["amount"] == amount
      end
    end

    private

      def amount
        @payment_link["amount"]
      end
  end
end

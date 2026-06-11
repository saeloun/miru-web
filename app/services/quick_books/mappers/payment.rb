# frozen_string_literal: true

module QuickBooks
  module Mappers
    class Payment < Base
      def initialize(connection:)
        @connection = connection
      end

      def payload(payment, customer_reference:, invoice_reference:)
        compact_payload(
          "CustomerRef" => { "value" => customer_reference.quickbooks_entity_id },
          "TotalAmt" => money(payment.amount),
          "TxnDate" => qbo_date(payment.transaction_date),
          "CurrencyRef" => currency(payment),
          "PrivateNote" => private_note(payment),
          "DepositToAccountRef" => deposit_account,
          "Line" => [
            {
              "Amount" => money(payment.amount),
              "LinkedTxn" => [
                {
                  "TxnId" => invoice_reference.quickbooks_entity_id,
                  "TxnType" => "Invoice"
                }
              ]
            }
          ]
        )
      end

      def update_payload(payment, customer_reference:, invoice_reference:, reference:)
        payload(payment, customer_reference:, invoice_reference:).merge(
          "Id" => reference.quickbooks_entity_id,
          "SyncToken" => reference.quickbooks_sync_token,
          "sparse" => false
        )
      end

      private

        attr_reader :connection

        def currency(payment)
          currency = payment.payment_currency.presence || payment.invoice.currency
          return if currency.blank?

          { "value" => currency }
        end

        def private_note(payment)
          note = ["Miru payment #{payment.id}", payment.transaction_type&.humanize]
          note << payment.note if payment.note.present?
          truncate(note.filter_map(&:presence).join(" | "), 4000)
        end

        def deposit_account
          return if connection.deposit_account_id.blank?

          { "value" => connection.deposit_account_id }
        end
    end
  end
end

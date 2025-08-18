# frozen_string_literal: true

module Api::V1
  module Invoices
    class RecentlyUpdatedController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :invoice, :index?

        invoices = current_company.invoices
                                  .includes(:client, :invoice_line_items)
                                  .order(updated_at: :desc)
                                  .limit(10)

        render json: {
          invoices: invoices.map { |invoice| serialize_invoice(invoice) }
        }
      end

      private

        def serialize_invoice(invoice)
          {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            client_name: invoice.client&.name,
            amount: invoice.amount,
            status: invoice.status,
            updated_at: invoice.updated_at,
            issue_date: invoice.issue_date
          }
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end

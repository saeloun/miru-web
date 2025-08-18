# frozen_string_literal: true

module Api::V1
  module Reports
    class OutstandingOverdueInvoicesController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        invoices = current_company.invoices.includes(:client)

        outstanding = invoices.sent
        overdue = invoices.overdue

        render json: {
          outstanding: outstanding.map { |inv| serialize_invoice(inv) },
          overdue: overdue.map { |inv| serialize_invoice(inv) },
          summary: {
            total_outstanding: outstanding.sum(:amount),
            total_overdue: overdue.sum(:amount),
            outstanding_count: outstanding.count,
            overdue_count: overdue.count
          }
        }
      end

      def download
        authorize :report, :index?

        respond_to do |format|
          format.csv { send_data generate_csv, filename: "outstanding_overdue_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf, filename: "outstanding_overdue_#{Date.current}.pdf" }
        end
      end

      private

        def serialize_invoice(invoice)
          {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            client: invoice.client&.name,
            amount: invoice.amount,
            due_date: invoice.due_date,
            days_overdue: (Date.current - invoice.due_date).to_i,
            status: invoice.status
          }
        end

        def generate_csv
          "Invoice Number,Client,Amount,Due Date,Days Overdue,Status\n"
        end

        def generate_pdf
          "PDF content"
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end

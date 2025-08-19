# frozen_string_literal: true

module Api::V1
  module Reports
    class PaymentsController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        payments = filter_payments
        report_data = generate_payment_report(payments)

        render json: {
          payments: report_data,
          summary: calculate_summary(report_data),
          currency: current_company.base_currency || "USD",
          filterOptions: {
            clients: format_client_options,
            paymentMethods: available_payment_methods
          }
        }
      end

      def download
        authorize :report, :index?

        payments = filter_payments
        report_data = generate_payment_report(payments)

        respond_to do |format|
          format.csv { send_data generate_csv(report_data), filename: "payment_report_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf(report_data), filename: "payment_report_#{Date.current}.pdf" }
        end
      end

      private

        def filter_payments
          scope = current_company.payments.includes(:invoice, invoice: :client)

          if params[:from].present? && params[:to].present?
            from_date = Date.parse(params[:from])
            to_date = Date.parse(params[:to])
            scope = scope.where(transaction_date: from_date..to_date)
          end

          if params[:client_ids].present?
            client_ids = params[:client_ids].split(",").map(&:to_i)
            scope = scope.joins(invoice: :client).where(invoices: { client_id: client_ids })
          end

          if params[:payment_method].present?
            scope = scope.where(transaction_type: params[:payment_method])
          end

          if params[:status].present?
            scope = scope.where(status: params[:status])
          end

          scope.order(transaction_date: :desc)
        end

        def generate_payment_report(payments)
          payments.map do |payment|
            invoice = payment.invoice
            client = invoice&.client

            {
              id: payment.id,
              payment_date: payment.transaction_date,
              transaction_id: "TXN-#{payment.id}", # Using ID as transaction ID since no separate field exists
              payment_method: payment.transaction_type&.humanize || "Unknown",
              client_name: client&.name || "Unknown Client",
              invoice_number: invoice&.invoice_number,
              amount: payment.amount,
              notes: payment.note,
              status: payment.status || "paid"
            }
          end
        end

        def calculate_summary(report_data)
          total_amount = report_data.sum { |r| r[:amount] }

          # Group by payment method
          by_method = report_data.group_by { |r| r[:payment_method] }
          method_breakdown = by_method.transform_values { |payments| payments.sum { |p| p[:amount] } }

          {
            total_amount: total_amount,
            payment_count: report_data.size,
            average_payment: report_data.any? ? (total_amount / report_data.size).round(2) : 0,
            by_payment_method: method_breakdown
          }
        end

        def generate_csv(report_data)
          require "csv"

          CSV.generate(headers: true) do |csv|
            csv << ["Date", "Client", "Invoice Number", "Payment Method", "Transaction ID", "Amount", "Status"]
            report_data.each do |payment|
              csv << [
                payment[:payment_date],
                payment[:client_name],
                payment[:invoice_number],
                payment[:payment_method],
                payment[:transaction_id],
                payment[:amount],
                payment[:status]
              ]
            end
          end
        end

        def generate_pdf(report_data)
          # TODO: Implement PDF generation using Grover or similar
          "PDF generation not yet implemented"
        end

        def format_client_options
          clients = current_company.clients.joins(:invoices).distinct
          clients.map do |client|
            {
              id: client.id,
              name: client.name
            }
          end
        end

        def available_payment_methods
          Payment.transaction_types.keys.map do |method|
            {
              value: method,
              label: method.humanize
            }
          end
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end

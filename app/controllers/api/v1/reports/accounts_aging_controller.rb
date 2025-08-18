# frozen_string_literal: true

module Api::V1
  module Reports
    class AccountsAgingController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        invoices = current_company.invoices.includes(:client).unpaid
        aging_report = generate_aging_report(invoices)

        render json: {
          report: aging_report,
          summary: calculate_summary(aging_report)
        }
      end

      def download
        authorize :report, :index?

        respond_to do |format|
          format.csv { send_data generate_csv, filename: "accounts_aging_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf, filename: "accounts_aging_#{Date.current}.pdf" }
        end
      end

      private

        def generate_aging_report(invoices)
          aging_buckets = {
            current: [],
            days_30: [],
            days_60: [],
            days_90: [],
            over_90: []
          }

          invoices.each do |invoice|
            days_overdue = (Date.current - invoice.due_date).to_i

            serialized = serialize_invoice(invoice, days_overdue)

            if days_overdue <= 0
              aging_buckets[:current] << serialized
            elsif days_overdue <= 30
              aging_buckets[:days_30] << serialized
            elsif days_overdue <= 60
              aging_buckets[:days_60] << serialized
            elsif days_overdue <= 90
              aging_buckets[:days_90] << serialized
            else
              aging_buckets[:over_90] << serialized
            end
          end

          aging_buckets
        end

        def serialize_invoice(invoice, days_overdue)
          {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            client: invoice.client&.name,
            amount: invoice.amount,
            due_date: invoice.due_date,
            days_overdue: days_overdue
          }
        end

        def calculate_summary(report)
          {
            current_amount: report[:current].sum { |i| i[:amount] },
            days_30_amount: report[:days_30].sum { |i| i[:amount] },
            days_60_amount: report[:days_60].sum { |i| i[:amount] },
            days_90_amount: report[:days_90].sum { |i| i[:amount] },
            over_90_amount: report[:over_90].sum { |i| i[:amount] },
            total_amount: report.values.flatten.sum { |i| i[:amount] }
          }
        end

        def generate_csv
          "Invoice Number,Client,Amount,Due Date,Days Overdue\n"
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

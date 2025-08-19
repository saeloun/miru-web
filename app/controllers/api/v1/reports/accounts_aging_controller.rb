# frozen_string_literal: true

module Api::V1
  module Reports
    class AccountsAgingController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        as_of_date = params[:as_of_date].present? ? Date.parse(params[:as_of_date]) : Date.current
        invoices = filter_invoices(as_of_date)
        aging_report = generate_aging_report(invoices, as_of_date)

        render json: {
          invoices: aging_report,
          summary: calculate_summary(aging_report),
          currency: current_company.base_currency || "USD"
        }
      end

      def download
        authorize :report, :index?

        as_of_date = params[:as_of_date].present? ? Date.parse(params[:as_of_date]) : Date.current
        invoices = filter_invoices(as_of_date)
        aging_report = generate_aging_report(invoices, as_of_date)

        respond_to do |format|
          format.csv { send_data generate_csv(aging_report), filename: "accounts_aging_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf(aging_report), filename: "accounts_aging_#{Date.current}.pdf" }
        end
      end

      private

        def filter_invoices(as_of_date)
          scope = current_company.invoices.includes(:client)
                                          .where("issue_date <= ?", as_of_date)
                                          .where.not(status: [:paid, :draft])

          if params[:client_ids].present?
            client_ids = params[:client_ids].split(",").map(&:to_i)
            scope = scope.where(client_id: client_ids)
          end

          scope
        end

        def generate_aging_report(invoices, as_of_date)
          invoices.map do |invoice|
            days_overdue = (as_of_date - invoice.due_date).to_i
            amount_due = invoice.amount_due || invoice.amount

            {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              client_name: invoice.client&.name,
              issue_date: invoice.issue_date,
              due_date: invoice.due_date,
              amount: invoice.amount,
              amount_due: amount_due,
              current: days_overdue <= 0 ? amount_due : 0,
              "1_30_days": days_overdue.between?(1, 30) ? amount_due : 0,
              "31_60_days": days_overdue.between?(31, 60) ? amount_due : 0,
              "61_90_days": days_overdue.between?(61, 90) ? amount_due : 0,
              "over_90_days": days_overdue > 90 ? amount_due : 0
            }
          end
        end

        def calculate_summary(invoices)
          {
            total: invoices.sum { |i| i[:amount_due] },
            current: invoices.sum { |i| i[:current] },
            "1_30_days": invoices.sum { |i| i[:"1_30_days"] },
            "31_60_days": invoices.sum { |i| i[:"31_60_days"] },
            "61_90_days": invoices.sum { |i| i[:"61_90_days"] },
            "over_90_days": invoices.sum { |i| i[:"over_90_days"] }
          }
        end

        def generate_csv(invoices)
          require "csv"

          CSV.generate(headers: true) do |csv|
            csv << ["Client", "Invoice Number", "Issue Date", "Due Date", "Amount Due", "Current", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days"]
            invoices.each do |invoice|
              csv << [
                invoice[:client_name],
                invoice[:invoice_number],
                invoice[:issue_date],
                invoice[:due_date],
                invoice[:amount_due],
                invoice[:current],
                invoice[:"1_30_days"],
                invoice[:"31_60_days"],
                invoice[:"61_90_days"],
                invoice[:"over_90_days"]
              ]
            end
          end
        end

        def generate_pdf(invoices)
          # TODO: Implement PDF generation using Grover or similar
          "PDF generation not yet implemented"
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end

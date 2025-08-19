# frozen_string_literal: true

module Api::V1
  module Reports
    class ClientRevenuesController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        clients = filter_clients
        report_data = generate_revenue_report(clients)

        render json: {
          clients: report_data,
          summary: calculate_summary(report_data),
          currency: current_company.base_currency || "USD"
        }
      end

      def new
        authorize :report, :index?

        render json: {
          clients: current_company.clients.select(:id, :name).map { |c| { id: c.id, name: c.name } }
        }
      end

      def download
        authorize :report, :index?

        clients = filter_clients
        report_data = generate_revenue_report(clients)

        respond_to do |format|
          format.csv { send_data generate_csv(report_data), filename: "client_revenue_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf(report_data), filename: "client_revenue_#{Date.current}.pdf" }
        end
      end

      private

        def filter_clients
          scope = current_company.clients.includes(:invoices)

          if params[:from].present? && params[:to].present?
            from_date = Date.parse(params[:from])
            to_date = Date.parse(params[:to])
            scope = scope.joins(:invoices).where(invoices: { issue_date: from_date..to_date }).distinct
          end

          if params[:client_ids].present?
            client_ids = params[:client_ids].split(",").map(&:to_i)
            scope = scope.where(id: client_ids)
          end

          scope
        end

        def generate_revenue_report(clients)
          clients.map do |client|
            invoices = client.invoices

            if params[:from].present? && params[:to].present?
              from_date = Date.parse(params[:from])
              to_date = Date.parse(params[:to])
              invoices = invoices.where(issue_date: from_date..to_date)
            end

            {
              id: client.id,
              name: client.name,
              logo: client.logo_url,
              total_revenue: invoices.sum(:amount),
              paid_amount: invoices.paid.sum(:amount),
              outstanding_amount: invoices.sent.sum(:amount),
              overdue_amount: invoices.overdue.sum(:amount),
              invoice_count: invoices.count
            }
          end
        end

        def calculate_summary(report_data)
          {
            totalRevenue: report_data.sum { |r| r[:total_revenue] },
            totalPaidAmount: report_data.sum { |r| r[:paid_amount] },
            totalOutstandingAmount: report_data.sum { |r| r[:outstanding_amount] },
            totalOverdueAmount: report_data.sum { |r| r[:overdue_amount] },
            clientCount: report_data.size
          }
        end

        def generate_csv(report_data)
          require "csv"

          CSV.generate(headers: true) do |csv|
            csv << ["Client", "Total Revenue", "Paid Amount", "Outstanding Amount", "Overdue Amount"]
            report_data.each do |client|
              csv << [
                client[:name],
                client[:total_revenue],
                client[:paid_amount],
                client[:outstanding_amount],
                client[:overdue_amount]
              ]
            end
          end
        end

        def generate_pdf(report_data)
          # TODO: Implement PDF generation using Grover or similar
          "PDF generation not yet implemented"
        end

        def current_company
          @_current_company ||= current_user.current_workspace
        end
    end
  end
end

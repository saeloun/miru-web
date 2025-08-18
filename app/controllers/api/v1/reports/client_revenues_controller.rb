# frozen_string_literal: true

module Api::V1
  module Reports
    class ClientRevenuesController < Api::V1::ApplicationController
      before_action :authenticate_user!
      after_action :verify_authorized

      def index
        authorize :report, :index?

        clients = current_company.clients.includes(:invoices)
        report_data = generate_revenue_report(clients)

        render json: {
          clients: report_data,
          summary: calculate_summary(report_data)
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

        respond_to do |format|
          format.csv { send_data generate_csv, filename: "client_revenue_#{Date.current}.csv" }
          format.pdf { send_data generate_pdf, filename: "client_revenue_#{Date.current}.pdf" }
        end
      end

      private

        def generate_revenue_report(clients)
          clients.map do |client|
            invoices = client.invoices
            {
              id: client.id,
              name: client.name,
              total_revenue: invoices.sum(:amount),
              paid_revenue: invoices.paid.sum(:amount),
              outstanding_revenue: invoices.sent.sum(:amount),
              overdue_revenue: invoices.overdue.sum(:amount),
              invoice_count: invoices.count
            }
          end
        end

        def calculate_summary(report_data)
          {
            total_revenue: report_data.sum { |r| r[:total_revenue] },
            total_paid: report_data.sum { |r| r[:paid_revenue] },
            total_outstanding: report_data.sum { |r| r[:outstanding_revenue] },
            total_overdue: report_data.sum { |r| r[:overdue_revenue] },
            client_count: report_data.size
          }
        end

        def generate_csv
          "Client,Total Revenue,Paid,Outstanding,Overdue\n"
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

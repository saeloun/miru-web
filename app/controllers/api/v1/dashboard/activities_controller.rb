# frozen_string_literal: true

module Api
  module V1
    module Dashboard
      class ActivitiesController < Api::V1::ApplicationController
        after_action :verify_authorized

        def index
          authorize :activity, policy_class: ::Dashboard::ActivityPolicy
          activities = fetch_activities
          paginated_activities = paginate_activities(activities)

          render json: {
            activities: paginated_activities[:activities],
            has_more: paginated_activities[:has_more],
            total_count: activities.count
          }, status: 200
        rescue StandardError => e
          Rails.logger.error "Activities API Error: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")

          render json: {
            activities: [],
            has_more: false,
            total_count: 0,
            error: "Failed to fetch activities"
          }, status: 500
        end

        private

          def fetch_activities
            invoices = scoped_invoices
              .where.not(status: "draft")
              .includes(:client)
              .map { |invoice| build_invoice_activity(invoice) }

            payments = scoped_payments
              .includes(invoice: :client)
              .map { |payment| build_payment_activity(payment) }

            (invoices + payments).sort_by { |a| -Time.parse(a[:timestamp]).to_i }
          end

          def build_invoice_activity(invoice)
            {
              id: "invoice_#{invoice.id}",
              type: "invoice",
              message: "Invoice ##{invoice.invoice_number} sent to #{invoice.client.name}",
              icon: "FileText",
              timestamp: (invoice.sent_at || invoice.updated_at || invoice.created_at).iso8601(3),
              metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                client_name: invoice.client.name,
                amount: invoice.amount.to_f,
                currency: invoice.currency || "USD",
                status: invoice.status,
                sent_at: invoice.sent_at,
                due_date: invoice.due_date
              }
            }
          end

          def build_payment_activity(payment)
            {
              id: "payment_#{payment.id}",
              type: "payment",
              message: "Payment of #{payment.amount.to_f} received from #{payment.invoice&.client&.name}",
              icon: "CurrencyDollar",
              timestamp: payment.created_at.iso8601(3),
              metadata: {
                payment_id: payment.id,
                invoice_id: payment.invoice_id,
                invoice_number: payment.invoice&.invoice_number,
                client_name: payment.invoice&.client&.name,
                amount: payment.amount.to_f,
                currency: payment.invoice&.currency || "USD",
                payment_date: payment.created_at.to_date,
                payment_method: payment.transaction_type
              }
            }
          end

          def paginate_activities(activities)
            per_page = (params[:per_page] || 10).to_i
            offset = (params[:offset] || 0).to_i

            paginated = activities[offset, per_page] || []

            {
              activities: paginated,
              has_more: activities.count > (offset + per_page)
            }
          end

          def scoped_invoices
            return Invoice.none if current_user.has_role?(:employee, current_company)
            return current_company.invoices unless current_user.has_role?(:client, current_company)

            current_company.invoices.where(client_id: current_user.client_members.kept.where(company: current_company).select(:client_id))
          end

          def scoped_payments
            return Payment.none if current_user.has_role?(:employee, current_company)
            return current_company.payments unless current_user.has_role?(:client, current_company)

            current_company.payments.joins(:invoice).where(invoices: {
              client_id: current_user.client_members.kept.where(company: current_company).select(:client_id)
            })
          end
      end
    end
  end
end

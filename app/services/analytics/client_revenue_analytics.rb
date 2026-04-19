# frozen_string_literal: true

module Analytics
  class ClientRevenueAnalytics < ApplicationService
    def initialize(company:, from:, to:, client_ids: nil)
      @company = company
      @from = from.to_date
      @to = to.to_date
      @client_ids = Array(client_ids).compact_blank
    end

    def process
      clients = scoped_clients.map do |client|
        build_client_summary(client)
      end

      {
        period: { from: from.iso8601, to: to.iso8601 },
        summary: build_summary(clients),
        top_clients: clients.sort_by { |client| -client[:total_revenue] }.first(5),
        clients:
      }
    end

    private

      attr_reader :company, :from, :to, :client_ids

      def scoped_clients
        @scoped_clients ||= begin
          relation = company.clients.kept.order(:name)
          client_ids.present? ? relation.where(id: client_ids) : relation
        end
      end

      def scoped_invoices
        @scoped_invoices ||= company.invoices.kept
          .where(client_id: scoped_clients.select(:id), issue_date: from..to)
          .where.not(status: :draft)
      end

      def scoped_payments
        @scoped_payments ||= Payment.joins(:invoice)
          .where(invoices: { company_id: company.id, client_id: scoped_clients.select(:id), discarded_at: nil })
          .where(payments: { transaction_date: from..to })
          .where.not(payments: { status: [Payment.statuses[:failed], Payment.statuses[:cancelled]] })
      end

      def invoice_totals
        @invoice_totals ||= scoped_invoices.group(:client_id).pluck(
          :client_id,
          Arel.sql("COALESCE(SUM(COALESCE(base_currency_amount, amount)), 0)"),
          Arel.sql("COUNT(*)")
        ).each_with_object({}) do |(client_id, total_revenue, invoice_count), totals|
          totals[client_id] = {
            total_revenue: total_revenue.to_f,
            invoice_count: invoice_count.to_i
          }
        end
      end

      def payment_totals
        @payment_totals ||= scoped_payments.group("invoices.client_id").pluck(
          Arel.sql("invoices.client_id"),
          Arel.sql("COALESCE(SUM(COALESCE(payments.base_currency_amount, payments.amount)), 0)"),
          Arel.sql("COUNT(payments.id)"),
          Arel.sql("AVG(payments.transaction_date - invoices.issue_date)")
        ).each_with_object({}) do |(client_id, collected_revenue, payment_count, payment_cycle_days), totals|
          totals[client_id] = {
            collected_revenue: collected_revenue.to_f,
            payment_count: payment_count.to_i,
            payment_cycle_days: payment_cycle_days.to_f.round(2)
          }
        end
      end

      def payment_dates_by_client
        @payment_dates_by_client ||= scoped_payments.order(:transaction_date).pluck(Arel.sql("invoices.client_id"), :transaction_date)
          .group_by(&:first)
          .transform_values { |rows| rows.map(&:last) }
      end

      def monthly_invoice_revenue
        @monthly_invoice_revenue ||= scoped_invoices.group(:client_id, Arel.sql("DATE_TRUNC('month', issue_date)"))
          .sum(Arel.sql("COALESCE(base_currency_amount, amount)"))
      end

      def build_client_summary(client)
        invoice_data = invoice_totals.fetch(client.id, { total_revenue: 0.0, invoice_count: 0 })
        payment_data = payment_totals.fetch(client.id, { collected_revenue: 0.0, payment_count: 0, payment_cycle_days: 0.0 })
        payment_dates = payment_dates_by_client.fetch(client.id, [])
        monthly_trend = build_monthly_trend(client.id)

        {
          client_id: client.id,
          client_name: client.name,
          total_revenue: invoice_data[:total_revenue].round(2),
          collected_revenue: payment_data[:collected_revenue].round(2),
          invoice_count: invoice_data[:invoice_count],
          payment_count: payment_data[:payment_count],
          average_invoice_amount: average_invoice_amount(invoice_data),
          payment_frequency_days: average_frequency_days(payment_dates),
          payment_cycle_days: payment_data[:payment_cycle_days],
          trend_direction: trend_direction(monthly_trend),
          monthly_trend:
        }
      end

      def build_summary(clients)
        total_revenue = clients.sum { |client| client[:total_revenue] }
        invoice_count = clients.sum { |client| client[:invoice_count] }
        payment_count = clients.sum { |client| client[:payment_count] }

        {
          client_count: clients.size,
          total_revenue: total_revenue.round(2),
          total_collected_revenue: clients.sum { |client| client[:collected_revenue] }.round(2),
          average_invoice_amount: invoice_count.positive? ? (total_revenue / invoice_count).round(2) : 0.0,
          average_payment_frequency_days: average_of(clients.pluck(:payment_frequency_days)),
          average_payment_cycle_days: average_of(clients.pluck(:payment_cycle_days)),
          payment_count:
        }
      end

      def build_monthly_trend(client_id)
        month_values = monthly_invoice_revenue.each_with_object({}) do |((current_client_id, month), revenue), values|
          next unless current_client_id == client_id

          values[month.to_date.beginning_of_month] = revenue.to_f.round(2)
        end

        months_in_range.map do |month|
          {
            month: month.iso8601,
            label: month.strftime("%b %Y"),
            revenue: month_values.fetch(month, 0.0)
          }
        end
      end

      def months_in_range
        @months_in_range ||= begin
          cursor = from.beginning_of_month
          last_month = to.beginning_of_month
          months = []

          while cursor <= last_month
            months << cursor
            cursor = cursor.next_month
          end

          months
        end
      end

      def average_invoice_amount(invoice_data)
        return 0.0 if invoice_data[:invoice_count].zero?

        (invoice_data[:total_revenue] / invoice_data[:invoice_count]).round(2)
      end

      def average_frequency_days(payment_dates)
        return 0.0 if payment_dates.size < 2

        gaps = payment_dates.each_cons(2).map { |first, second| (second - first).to_i }
        average_of(gaps)
      end

      def trend_direction(monthly_trend)
        recent_values = monthly_trend.last(2).pluck(:revenue)
        return "flat" if recent_values.size < 2 || recent_values.first == recent_values.last

        recent_values.last > recent_values.first ? "up" : "down"
      end

      def average_of(values)
        filtered_values = values.map(&:to_f)
        return 0.0 if filtered_values.empty?

        (filtered_values.sum / filtered_values.size).round(2)
      end
  end
end

# frozen_string_literal: true

module Reports
  class MonthlyCashFlowDigest
    TOP_SOURCES_LIMIT = 4

    def initialize(company:, month: Date.current.prev_month)
      @company = company
      @month = month.to_date.beginning_of_month
    end

    def process
      {
        month_label: month.strftime("%B"),
        month_year_label: month.strftime("%B %Y"),
        period_start: period.begin,
        period_end: period.end,
        currency: company.base_currency,
        money_in_total: money_in_total,
        previous_money_in_total: previous_money_in_total,
        money_out_total: money_out_total,
        previous_money_out_total: previous_money_out_total,
        net_change: net_change,
        average_daily_net_change: average_daily_net_change,
        top_money_in_sources: top_money_in_sources,
        top_money_out_sources: top_money_out_sources,
        trend_points: trend_points
      }
    end

    private

      attr_reader :company, :month

      def period
        @period ||= month.beginning_of_month..month.end_of_month
      end

      def previous_period
        @previous_period ||= (month.prev_month.beginning_of_month..month.prev_month.end_of_month)
      end

      def amount_sql
        "COALESCE(payments.base_currency_amount, payments.amount)"
      end

      def payments
        @payments ||= Payment
          .joins(invoice: :client)
          .where(invoices: { company_id: company.id })
          .where(transaction_date: period)
          .where.not(status: [:failed, :cancelled])
      end

      def previous_payments
        @previous_payments ||= Payment
          .joins(invoice: :client)
          .where(invoices: { company_id: company.id })
          .where(transaction_date: previous_period)
          .where.not(status: [:failed, :cancelled])
      end

      def paid_expenses
        @paid_expenses ||= company.expenses.kept.paid.where(paid_at: period.begin.beginning_of_day..period.end.end_of_day)
      end

      def previous_paid_expenses
        @previous_paid_expenses ||= company.expenses.kept.paid.where(
          paid_at: previous_period.begin.beginning_of_day..previous_period.end.end_of_day
        )
      end

      def money_in_total
        @money_in_total ||= payments.sum(Arel.sql(amount_sql)).to_f.round(2)
      end

      def previous_money_in_total
        @previous_money_in_total ||= previous_payments.sum(Arel.sql(amount_sql)).to_f.round(2)
      end

      def money_out_total
        @money_out_total ||= paid_expenses.sum(:amount).to_f.round(2)
      end

      def previous_money_out_total
        @previous_money_out_total ||= previous_paid_expenses.sum(:amount).to_f.round(2)
      end

      def net_change
        @net_change ||= (money_in_total - money_out_total).round(2)
      end

      def average_daily_net_change
        (net_change / period.count).round(2)
      end

      def top_money_in_sources
        @top_money_in_sources ||= begin
          grouped = payments
            .group("clients.id", "clients.name")
            .sum(Arel.sql(amount_sql))
            .map { |(_, name), amount| { name:, amount: amount.to_f.round(2) } }
            .sort_by { |source| -source[:amount] }

          summarize_sources(grouped)
        end
      end

      def top_money_out_sources
        @top_money_out_sources ||= begin
          grouped = paid_expenses.each_with_object(Hash.new(0.0)) do |expense, buckets|
            label = expense.display_vendor_name.presence || expense.display_category_name.presence || "Other expenses"
            buckets[label] += expense.amount.to_f
          end

          summarize_sources(
            grouped.map { |name, amount| { name:, amount: amount.round(2) } }.sort_by { |source| -source[:amount] }
          )
        end
      end

      def summarize_sources(sources)
        leading = sources.first(TOP_SOURCES_LIMIT)
        remainder = sources.drop(TOP_SOURCES_LIMIT)

        if remainder.any?
          leading + [{ name: "Other", amount: remainder.sum { |source| source[:amount] }.round(2) }]
        else
          leading
        end
      end

      def trend_points
        payment_totals = payments.group(:transaction_date).sum(Arel.sql(amount_sql)).transform_values(&:to_f)
        expense_totals = paid_expenses.each_with_object(Hash.new(0.0)) do |expense, totals|
          totals[expense.paid_at.to_date] += expense.amount.to_f
        end

        running_total = 0.0
        points = period.map do |date|
          running_total += payment_totals.fetch(date, 0.0) - expense_totals.fetch(date, 0.0)
          { label: date.strftime("%b %-d"), amount: running_total.round(2) }
        end

        minimum = points.min_by { |point| point[:amount] }&.dig(:amount).to_f
        maximum = points.max_by { |point| point[:amount] }&.dig(:amount).to_f
        spread = maximum - minimum

        points.map do |point|
          scale = spread.zero? ? 0.5 : (point[:amount] - minimum) / spread

          point.merge(height: (24 + (scale * 64)).round)
        end
      end
  end
end

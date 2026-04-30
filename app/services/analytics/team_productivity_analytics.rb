# frozen_string_literal: true

module Analytics
  class TeamProductivityAnalytics < ApplicationService
    BILLABLE_STATUSES = [TimesheetEntry.bill_statuses[:unbilled], TimesheetEntry.bill_statuses[:billed]].freeze

    def initialize(company:, from:, to:, user_ids: nil)
      @company = company
      @from = from.to_date
      @to = to.to_date
      @user_ids = Array(user_ids).compact_blank
    end

    def process
      members = scoped_users.map do |user|
        build_member_summary(user, entry_totals[user.id] || default_entry_totals, invoiced_revenue_by_user[user.id].to_f)
      end

      {
        period: { from: from.iso8601, to: to.iso8601 },
        summary: build_summary(members),
        members:
      }
    end

    private

      attr_reader :company, :from, :to, :user_ids

      def scoped_users
        @scoped_users ||= begin
          relation = company.users.with_kept_employments.distinct.order(:first_name, :last_name)
          user_ids.present? ? relation.where(id: user_ids) : relation
        end
      end

      def scoped_entries
        @scoped_entries ||= TimesheetEntry.kept
          .in_workspace(company)
          .where(user_id: scoped_user_ids_relation, work_date: from..to)
      end

      def entry_totals
        @entry_totals ||= scoped_entries.group(:user_id).pluck(
          :user_id,
          Arel.sql("COALESCE(SUM(duration), 0)"),
          Arel.sql("COALESCE(SUM(CASE WHEN bill_status IN (#{BILLABLE_STATUSES.join(',')}) THEN duration ELSE 0 END), 0)"),
          Arel.sql("COALESCE(SUM(CASE WHEN bill_status = #{TimesheetEntry.bill_statuses[:non_billable]} THEN duration ELSE 0 END), 0)")
        ).each_with_object({}) do |(user_id, total_minutes, billable_minutes, non_billable_minutes), totals|
          totals[user_id] = {
            total_minutes: total_minutes.to_f,
            billable_minutes: billable_minutes.to_f,
            non_billable_minutes: non_billable_minutes.to_f
          }
        end
      end

      def invoiced_revenue_by_user
        @invoiced_revenue_by_user ||= InvoiceLineItem.joins(:invoice, :timesheet_entry)
          .where(timesheet_entries: { user_id: scoped_user_ids_relation })
          .where(invoices: { company_id: company.id, discarded_at: nil })
          .where.not(invoices: { status: Invoice.statuses[:draft] })
          .where(invoice_line_items: { date: from..to })
          .group("timesheet_entries.user_id")
          .sum(Arel.sql("(invoice_line_items.quantity * invoice_line_items.rate) / 60.0"))
      end

      def scoped_user_ids_relation
        scoped_users.unscope(:order).select(:id)
      end

      def build_member_summary(user, totals, invoiced_revenue)
        expected_minutes = expected_minutes_for(user)
        billable_hours = minutes_to_hours(totals[:billable_minutes])

        {
          user_id: user.id,
          user_name: user.full_name,
          total_hours: minutes_to_hours(totals[:total_minutes]),
          billable_hours:,
          non_billable_hours: minutes_to_hours(totals[:non_billable_minutes]),
          utilization_rate: percentage(totals[:billable_minutes], expected_minutes),
          billable_ratio: percentage(totals[:billable_minutes], totals[:total_minutes]),
          invoiced_revenue: invoiced_revenue.round(2),
          average_hourly_rate: billable_hours.positive? ? (invoiced_revenue / billable_hours).round(2) : 0.0
        }
      end

      def build_summary(members)
        total_hours = members.sum { |member| member[:total_hours] }
        billable_hours = members.sum { |member| member[:billable_hours] }
        non_billable_hours = members.sum { |member| member[:non_billable_hours] }
        invoiced_revenue = members.sum { |member| member[:invoiced_revenue] }
        total_expected_minutes = scoped_users.sum { |user| expected_minutes_for(user) }

        {
          team_size: members.size,
          total_hours: total_hours.round(2),
          billable_hours: billable_hours.round(2),
          non_billable_hours: non_billable_hours.round(2),
          utilization_rate: percentage(billable_hours * 60, total_expected_minutes),
          billable_ratio: percentage(billable_hours, total_hours),
          invoiced_revenue: invoiced_revenue.round(2),
          average_hourly_rate: billable_hours.positive? ? (invoiced_revenue / billable_hours).round(2) : 0.0
        }
      end

      def expected_minutes_for(user)
        employment = user.employments.kept.find_by(company_id: company.id)
        return 0.0 unless employment

        effective_from = [from, employment.joined_at || from].compact.max
        effective_to = [to, employment.resigned_at || to].compact.min
        return 0.0 if effective_from > effective_to

        working_days = business_days_between(effective_from, effective_to)
        working_days * working_minutes_per_day
      end

      def working_minutes_per_day
        @working_minutes_per_day ||= begin
          working_days_per_week = company.working_days.to_i.nonzero? || 5
          ((company.working_hours.to_f / working_days_per_week) * 60).round(2)
        end
      end

      def business_days_between(start_date, end_date)
        (start_date..end_date).count { |date| !date.saturday? && !date.sunday? }
      end

      def percentage(numerator, denominator)
        return 0.0 if denominator.to_f <= 0

        ((numerator.to_f / denominator.to_f) * 100).round(2)
      end

      def minutes_to_hours(minutes)
        (minutes.to_f / 60.0).round(2)
      end

      def default_entry_totals
        {
          total_minutes: 0.0,
          billable_minutes: 0.0,
          non_billable_minutes: 0.0
        }
      end
  end
end

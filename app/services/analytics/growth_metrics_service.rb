# frozen_string_literal: true

module Analytics
  class GrowthMetricsService < ApplicationService
    SIGNUP_WEEKS = 4
    CHECKOUT_EVENTS = %w[subscription_checkout_started subscription_purchased].freeze

    def process
      {
        signups:,
        activation_funnel:,
        weekly_active:,
        trials:,
        checkouts:,
        top_workspaces:
      }
    end

    private

      def now
        @now ||= Time.current
      end

      def signups
        company_counts = signup_counts(Company)
        user_counts = signup_counts(User)

        {
          weeks: signup_weeks.map do |week_start|
            {
              week_start:,
              companies: company_counts.fetch(week_start, 0),
              users: user_counts.fetch(week_start, 0)
            }
          end,
          totals: {
            companies: Company.count,
            users: User.count
          }
        }
      end

      def signup_counts(model)
        model
          .where(created_at: signup_range)
          .group(Arel.sql("DATE_TRUNC('week', created_at)"))
          .count
          .transform_keys(&:to_date)
      end

      def signup_weeks
        @signup_weeks ||= SIGNUP_WEEKS.times.map { |index| now.utc.to_date.beginning_of_week - index.weeks }
      end

      # DATE_TRUNC buckets the bare timestamp column in UTC, so the Ruby side
      # of the week math must stay in UTC even if config.time_zone changes.
      def signup_range
        signup_weeks.last.in_time_zone("UTC")...(signup_weeks.first + 1.week).in_time_zone("UTC")
      end

      def activation_funnel
        {
          total: Company.count,
          with_client: companies_with_client,
          with_activity: companies_with_activity,
          with_invoice: companies_with_invoice,
          with_payment: companies_with_payment
        }
      end

      def companies_with_client
        Company.where(<<~SQL.squish).count
          EXISTS (
            SELECT 1 FROM clients
            WHERE clients.company_id = companies.id AND clients.discarded_at IS NULL
          )
        SQL
      end

      def companies_with_activity
        Company.where(<<~SQL.squish).count
          EXISTS (
            SELECT 1
            FROM timesheet_entries
            INNER JOIN projects ON projects.id = timesheet_entries.project_id
            INNER JOIN clients ON clients.id = projects.client_id
            WHERE clients.company_id = companies.id
              AND timesheet_entries.discarded_at IS NULL
              AND projects.discarded_at IS NULL
              AND clients.discarded_at IS NULL
          ) OR EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.company_id = companies.id AND invoices.discarded_at IS NULL
          )
        SQL
      end

      def companies_with_invoice
        Company.where(<<~SQL.squish).count
          EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.company_id = companies.id AND invoices.discarded_at IS NULL
          )
        SQL
      end

      def companies_with_payment
        Company.where(<<~SQL.squish).count
          EXISTS (
            SELECT 1
            FROM payments
            INNER JOIN invoices ON invoices.id = payments.invoice_id
            WHERE invoices.company_id = companies.id AND invoices.discarded_at IS NULL
          )
        SQL
      end

      def weekly_active
        {
          companies: weekly_active_company_ids.size,
          users: Ahoy::Event
            .where(name: "user_login", time: seven_day_range)
            .where.not(user_id: nil)
            .distinct
            .count(:user_id)
        }
      end

      def weekly_active_company_ids
        time_entry_company_ids | invoice_company_ids | payment_company_ids
      end

      def time_entry_company_ids
        TimesheetEntry.kept
          .joins(project: :client)
          .merge(Project.kept)
          .merge(Client.kept)
          .where(timesheet_entries: { created_at: seven_day_range })
          .distinct
          .pluck("clients.company_id")
      end

      def invoice_company_ids
        Invoice.kept
          .where(created_at: seven_day_range)
          .where.not(company_id: nil)
          .distinct
          .pluck(:company_id)
      end

      def payment_company_ids
        Payment
          .joins(:invoice)
          .merge(Invoice.kept)
          .where(payments: { created_at: seven_day_range })
          .where.not(invoices: { company_id: nil })
          .distinct
          .pluck("invoices.company_id")
      end

      def trials
        trial_companies = Company.where.not(trial_started_at: nil)

        {
          active: trial_companies.where("trial_ends_at > ?", now).count,
          ending_within_7_days: trial_companies.where(trial_ends_at: now..(now + 7.days)).count,
          expired: trial_companies.where(trial_ends_at: ..now).where.not(plan_tier: "paid").count,
          converted: trial_companies.where(plan_tier: "paid").count
        }
      end

      def checkouts
        {
          last_7_days: checkout_counts(seven_day_range),
          last_30_days: checkout_counts(thirty_day_range)
        }
      end

      def checkout_counts(range)
        counts = Ahoy::Event.where(name: CHECKOUT_EVENTS, time: range).group(:name).count

        {
          started: counts.fetch("subscription_checkout_started", 0),
          purchased: counts.fetch("subscription_purchased", 0)
        }
      end

      def top_workspaces
        activity = activity_by_company
        user_counts = Employment.kept.group(:company_id).distinct.count(:user_id)

        Company.pluck(:id, :name, :billing_exempt).map do |id, name, billing_exempt|
          company_activity = activity.fetch(id, { activity_score: 0, last_activity_at: nil })

          {
            id:,
            name:,
            users_count: user_counts.fetch(id, 0),
            activity_score: company_activity[:activity_score],
            last_activity_at: company_activity[:last_activity_at],
            billing_exempt:
          }
        end.sort_by { |workspace| [-workspace[:activity_score], workspace[:name].downcase, workspace[:id]] }.first(10)
      end

      def activity_by_company
        [time_entry_activity, invoice_activity, payment_activity].each_with_object({}) do |rows, activity|
          rows.each do |company_id, count, last_activity_at|
            company_activity = activity[company_id] ||= { activity_score: 0, last_activity_at: nil }
            company_activity[:activity_score] += count
            company_activity[:last_activity_at] = [company_activity[:last_activity_at], last_activity_at].compact.max
          end
        end
      end

      def time_entry_activity
        TimesheetEntry.kept
          .joins(project: :client)
          .merge(Project.kept)
          .merge(Client.kept)
          .where(timesheet_entries: { created_at: thirty_day_range })
          .group("clients.company_id")
          .pluck(
            Arel.sql("clients.company_id"),
            Arel.sql("COUNT(*)"),
            Arel.sql("MAX(timesheet_entries.created_at)")
          )
      end

      def invoice_activity
        Invoice.kept
          .where(created_at: thirty_day_range)
          .where.not(company_id: nil)
          .group(:company_id)
          .pluck(:company_id, Arel.sql("COUNT(*)"), Arel.sql("MAX(invoices.created_at)"))
      end

      def payment_activity
        Payment
          .joins(:invoice)
          .merge(Invoice.kept)
          .where(payments: { created_at: thirty_day_range })
          .where.not(invoices: { company_id: nil })
          .group("invoices.company_id")
          .pluck(
            Arel.sql("invoices.company_id"),
            Arel.sql("COUNT(*)"),
            Arel.sql("MAX(payments.created_at)")
          )
      end

      def seven_day_range
        (now - 7.days)..now
      end

      def thirty_day_range
        (now - 30.days)..now
      end
  end
end

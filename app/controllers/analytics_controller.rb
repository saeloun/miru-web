# frozen_string_literal: true

class AnalyticsController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_analytics_access!

  def index
    @analytics_data = gather_analytics_data
  end

  def revenue
    @revenue_data = revenue_metrics
  end

  def activity
    @activity_data = activity_metrics
  end

  def currency
    @currency_data = currency_conversion_metrics
  end

  private

    def ensure_analytics_access!
      unless current_user.has_analytics_access?
        redirect_to root_path, alert: "You don't have access to analytics."
      end
    end

    def gather_analytics_data
      {
        overview: overview_metrics,
        revenue: revenue_metrics,
        activity: activity_metrics,
        currency: currency_conversion_metrics,
        users: user_metrics,
        invoices: invoice_metrics,
        clients: client_metrics,
        projects: project_metrics
      }
    end

    def overview_metrics
      {
        total_revenue: calculate_total_revenue,
        outstanding_amount: calculate_outstanding_amount,
        overdue_amount: calculate_overdue_amount,
        active_users: analytics_users.count,
        active_clients: analytics_clients.count,
        active_projects: analytics_projects.count,
        invoices_this_month: analytics_invoices.where(issue_date: Date.current.beginning_of_month..Date.current.end_of_month).count,
        payments_this_month: analytics_payments.where(transaction_date: Date.current.beginning_of_month..Date.current.end_of_month).count
      }
    end

    def revenue_metrics
      {
        by_month: revenue_by_month,
        by_client: revenue_by_client,
        by_currency: revenue_by_currency,
        conversion_impact: currency_conversion_impact
      }
    end

    def activity_metrics
      {
        recent_events: recent_tracking_events,
        invoice_activity: invoice_activity_summary,
        payment_activity: payment_activity_summary,
        user_activity: user_activity_summary
      }
    end

    def currency_conversion_metrics
      {
        exchange_rates: recent_exchange_rates,
        conversion_audit: recent_conversions,
        currency_distribution: currency_distribution,
        conversion_savings: calculate_conversion_impact
      }
    end

    def user_metrics
      {
        total_users: analytics_users.count,
        new_users_this_month: analytics_users.where(created_at: Date.current.beginning_of_month..Date.current.end_of_month).count,
        active_users_this_week: analytics_users.joins(timesheet_entries: { project: :client })
                                       .where(clients: { company_id: analytics_company_ids },
                                         timesheet_entries: { work_date: 1.week.ago..Date.current })
                                       .distinct
                                       .count,
        user_roles: analytics_users.joins(:roles).group("roles.name").count
      }
    end

    def invoice_metrics
      {
        total_invoices: analytics_invoices.count,
        invoices_by_status: analytics_invoices.group(:status).count,
        average_invoice_amount: analytics_invoices.average(:amount).to_f.round(2),
        invoices_by_month: invoices_by_month_chart_data,
        payment_success_rate: calculate_payment_success_rate
      }
    end

    def client_metrics
      {
        total_clients: analytics_clients.count,
        new_clients_this_month: analytics_clients.where(created_at: Date.current.beginning_of_month..Date.current.end_of_month).count,
        top_clients_by_revenue: top_clients_by_revenue(10),
        client_retention_rate: calculate_client_retention_rate
      }
    end

    def project_metrics
      {
        total_projects: analytics_projects.count,
        active_projects: analytics_projects.joins(:timesheet_entries)
                         .where(timesheet_entries: { work_date: 1.month.ago..Date.current })
                         .distinct
                         .count,
        billable_vs_non_billable: analytics_projects.group(:billable).count,
        hours_by_project: hours_by_project_chart_data
      }
    end

    def calculate_total_revenue
      analytics_invoices.where(status: :paid).sum(invoice_amount_sql)
    end

    def calculate_outstanding_amount
      analytics_invoices.where(status: [:sent, :viewed]).sum(invoice_amount_sql)
    end

    def calculate_overdue_amount
      analytics_invoices.where(status: :overdue).sum(invoice_amount_sql)
    end

    def revenue_by_month
      analytics_invoices.where(status: :paid, issue_date: 12.months.ago..Date.current)
        .group("DATE_TRUNC('month', issue_date)")
        .sum(invoice_amount_sql)
        .transform_keys { |month| month.to_date.beginning_of_month }
    end

    def revenue_by_client
      analytics_clients.joins(:invoices)
        .where(invoices: { status: :paid })
        .group("clients.name")
        .sum(invoice_amount_sql)
        .sort_by { |_, amount| -amount }
        .first(10)
        .to_h
    end

    def revenue_by_currency
      analytics_invoices.where(status: :paid).group(:currency).sum(:amount)
    end

    def currency_conversion_impact
      conversions = analytics_invoices.where.not(exchange_rate: nil).select(:currency, :amount, :base_currency_amount, :exchange_rate)

      {
        total_conversions: conversions.count,
        currencies_used: conversions.distinct.count(:currency),
        average_rate_variance: calculate_rate_variance(conversions)
      }
    end

    def recent_tracking_events
      analytics_events.order(time: :desc).limit(100).includes(:user).map do |event|
        {
          time: event.time,
          user: event.user&.full_name,
          name: event.name,
          properties: event.properties
        }
      end
    end

    def invoice_activity_summary
      events = analytics_events.where(time: Date.current.beginning_of_day..Date.current.end_of_day)

      {
        created_today: events.where(name: "create_invoice").count,
        sent_today: events.where(name: "send_invoice").count,
        viewed_today: events.where(name: "view_invoice").count,
        downloaded_today: events.where(name: "download_invoice").count
      }
    end

    def payment_activity_summary
      monthly_range = Date.current.beginning_of_month..Date.current.end_of_month
      payments_today = analytics_payments.where(transaction_date: Date.current)

      {
        payments_today: payments_today.count,
        amount_collected_today: payments_today.sum(payment_amount_sql),
        stripe_payments: analytics_payments.where(transaction_type: :stripe, transaction_date: monthly_range).count,
        bank_transfers: analytics_payments.where(transaction_type: :bank_transfer, transaction_date: monthly_range).count
      }
    end

    def user_activity_summary
      {
        active_today: analytics_users.joins(:ahoy_events)
          .where(ahoy_events: { time: Date.current.beginning_of_day..Date.current.end_of_day })
          .distinct
          .count,
        hours_logged_today: analytics_timesheet_entries.where(work_date: Date.current).sum(:duration) / 60.0,
        most_active_users: analytics_users.joins(:ahoy_events)
          .where(ahoy_events: { time: 7.days.ago..Date.current })
          .group("users.id")
          .order("count(ahoy_events.id) DESC")
          .limit(5)
          .pluck(:first_name, :last_name, "count(ahoy_events.id)")
      }
    end

    def recent_exchange_rates
      ExchangeRate.order(date: :desc, created_at: :desc)
        .limit(20)
        .map do |rate|
          {
            date: rate.date,
            from: rate.from_currency,
            to: rate.to_currency,
            rate: rate.rate,
            source: rate.source
          }
        end
    end

    def recent_conversions
      analytics_invoices.where.not(exchange_rate: nil)
        .order(created_at: :desc)
        .limit(20)
        .map do |invoice|
          {
            invoice_number: invoice.invoice_number,
            currency: invoice.currency,
            amount: invoice.amount,
            base_amount: invoice.base_currency_amount,
            rate: invoice.exchange_rate,
            date: invoice.exchange_rate_date
          }
        end
    end

    def currency_distribution
      analytics_invoices.group(:currency).count
    end

    def calculate_conversion_impact
      invoices_with_conversion = analytics_invoices.where.not(exchange_rate: nil)

      total_impact = invoices_with_conversion.sum do |invoice|
        current_rate = ExchangeRate.rate_for(invoice.currency, invoice.company.base_currency, Date.current)
        if current_rate
          (invoice.amount * current_rate) - invoice.base_currency_amount
        else
          0
        end
      end

      {
        total_impact: total_impact.round(2),
        positive_impact: total_impact > 0,
        affected_invoices: invoices_with_conversion.count
      }
    end

    def invoices_by_month_chart_data
      analytics_invoices.where(issue_date: 12.months.ago..Date.current)
        .group("TO_CHAR(issue_date, 'YYYY-MM')")
        .count
    end

    def hours_by_project_chart_data
      analytics_projects.joins(:timesheet_entries)
        .where(timesheet_entries: { work_date: 30.days.ago..Date.current })
        .group("projects.name")
        .sum("timesheet_entries.duration / 60.0")
        .sort_by { |_, hours| -hours }
        .first(10)
        .to_h
    end

    def top_clients_by_revenue(limit = 10)
      analytics_clients.joins(:invoices)
        .where(invoices: { status: :paid })
        .group("clients.name")
        .sum(invoice_amount_sql)
        .sort_by { |_, amount| -amount }
        .first(limit)
        .to_h
    end

    def calculate_payment_success_rate
      total_invoices = analytics_invoices.where(status: [:paid, :overdue]).count
      return 0 if total_invoices == 0

      paid_invoices = analytics_invoices.where(status: :paid).count
      ((paid_invoices.to_f / total_invoices) * 100).round(2)
    end

    def calculate_client_retention_rate
      last_year_clients = analytics_clients.joins(:invoices)
        .where(invoices: { issue_date: 1.year.ago..6.months.ago })
        .distinct
        .pluck(:id)

      this_period_clients = analytics_clients.joins(:invoices)
        .where(invoices: { issue_date: 6.months.ago..Date.current })
        .distinct
        .pluck(:id)

      return 0 if last_year_clients.empty?

      retained = (last_year_clients & this_period_clients).count
      ((retained.to_f / last_year_clients.count) * 100).round(2)
    end

    def calculate_rate_variance(conversions)
      return 0 if conversions.empty?

      variances = conversions.filter_map do |invoice|
        expected = invoice.amount * invoice.exchange_rate
        actual = invoice.base_currency_amount
        ((actual - expected).abs / expected) * 100 if expected > 0
      end

      return 0 if variances.empty?

      variances.sum / variances.count
    end

    def analytics_companies
      @analytics_companies ||= current_user.super_admin? ? Company.all : current_user.companies
    end

    def analytics_company_ids
      @analytics_company_ids ||= analytics_companies.pluck(:id)
    end

    def analytics_users
      @analytics_users ||= User.kept.joins(:employments)
        .merge(Employment.kept)
        .where(employments: { company_id: analytics_company_ids })
        .distinct
    end

    def analytics_clients
      @analytics_clients ||= Client.kept.where(company_id: analytics_company_ids)
    end

    def analytics_projects
      @analytics_projects ||= Project.kept.joins(:client).where(clients: { company_id: analytics_company_ids })
    end

    def analytics_invoices
      @analytics_invoices ||= Invoice.kept.where(company_id: analytics_company_ids)
    end

    def analytics_payments
      @analytics_payments ||= Payment.joins(:invoice).where(invoices: { company_id: analytics_company_ids })
    end

    def analytics_timesheet_entries
      @analytics_timesheet_entries ||= TimesheetEntry.kept
        .joins(project: :client)
        .where(clients: { company_id: analytics_company_ids })
    end

    def analytics_events
      @analytics_events ||= Ahoy::Event.where(user_id: analytics_users.select(:id))
    end

    def invoice_amount_sql
      "CASE WHEN invoices.base_currency_amount > 0 THEN invoices.base_currency_amount ELSE invoices.amount END"
    end

    def payment_amount_sql
      "CASE WHEN payments.base_currency_amount > 0 THEN payments.base_currency_amount ELSE payments.amount END"
    end
end

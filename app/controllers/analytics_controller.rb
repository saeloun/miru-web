# frozen_string_literal: true

class AnalyticsController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_analytics_access!

  def index
    @analytics_data = gather_analytics_data
  end

  def revenue
    @revenue_data = gather_revenue_analytics
  end

  def activity
    @activity_data = gather_activity_analytics
  end

  def currency
    @currency_data = gather_currency_analytics
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
        active_users: User.kept.count,
        active_clients: Client.kept.count,
        active_projects: Project.kept.count,
        invoices_this_month: Invoice.kept.where(issue_date: Date.current.beginning_of_month..Date.current.end_of_month).count,
        payments_this_month: Payment.where(transaction_date: Date.current.beginning_of_month..Date.current.end_of_month).count
      }
    end

    def revenue_metrics
      companies = current_user.super_admin? ? Company.all : current_user.companies

      {
        by_month: revenue_by_month(companies),
        by_client: revenue_by_client(companies),
        by_currency: revenue_by_currency(companies),
        conversion_impact: currency_conversion_impact(companies)
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
        total_users: User.kept.count,
        new_users_this_month: User.where(created_at: Date.current.beginning_of_month..Date.current.end_of_month).count,
        active_users_this_week: User.joins(:timesheet_entries).where(timesheet_entries: { work_date: 1.week.ago..Date.current }).distinct.count,
        user_roles: User.joins(:roles).group("roles.name").count
      }
    end

    def invoice_metrics
      {
        total_invoices: Invoice.kept.count,
        invoices_by_status: Invoice.kept.group(:status).count,
        average_invoice_amount: Invoice.kept.average(:amount).to_f.round(2),
        invoices_by_month: invoices_by_month_chart_data,
        payment_success_rate: calculate_payment_success_rate
      }
    end

    def client_metrics
      {
        total_clients: Client.kept.count,
        new_clients_this_month: Client.where(created_at: Date.current.beginning_of_month..Date.current.end_of_month).count,
        top_clients_by_revenue: top_clients_by_revenue(10),
        client_retention_rate: calculate_client_retention_rate
      }
    end

    def project_metrics
      {
        total_projects: Project.kept.count,
        active_projects: Project.joins(:timesheet_entries).where(timesheet_entries: { work_date: 1.month.ago..Date.current }).distinct.count,
        billable_vs_non_billable: Project.kept.group(:billable).count,
        hours_by_project: hours_by_project_chart_data
      }
    end

    def calculate_total_revenue
      companies = current_user.super_admin? ? Company.all : current_user.companies
      Invoice.joins(:company)
             .where(company: companies, status: :paid)
             .sum { |invoice| invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount }
    end

    def calculate_outstanding_amount
      companies = current_user.super_admin? ? Company.all : current_user.companies
      Invoice.joins(:company)
             .where(company: companies, status: [:sent, :viewed])
             .sum { |invoice| invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount }
    end

    def calculate_overdue_amount
      companies = current_user.super_admin? ? Company.all : current_user.companies
      Invoice.joins(:company)
             .where(company: companies, status: :overdue)
             .sum { |invoice| invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount }
    end

    def revenue_by_month(companies)
      Invoice.joins(:company)
             .where(company: companies, status: :paid)
             .where(issue_date: 12.months.ago..Date.current)
             .group_by { |i| i.issue_date.beginning_of_month }
             .transform_values { |invoices|
               invoices.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }
             }
    end

    def revenue_by_client(companies)
      Client.joins(:invoices, :company)
            .where(company: companies, invoices: { status: :paid })
            .group("clients.name")
            .sum("CASE WHEN invoices.base_currency_amount > 0 THEN invoices.base_currency_amount ELSE invoices.amount END")
            .sort_by { |_, amount| -amount }
            .first(10)
            .to_h
    end

    def revenue_by_currency(companies)
      Invoice.joins(:company)
             .where(company: companies, status: :paid)
             .group(:currency)
             .sum(:amount)
    end

    def currency_conversion_impact(companies)
      conversions = Invoice.joins(:company)
                           .where(company: companies)
                           .where.not(exchange_rate: nil)
                           .select(:currency, :amount, :base_currency_amount, :exchange_rate)

      {
        total_conversions: conversions.count,
        currencies_used: conversions.pluck(:currency).uniq.count,
        average_rate_variance: calculate_rate_variance(conversions)
      }
    end

    def recent_tracking_events
      Ahoy::Event.order(time: :desc)
                 .limit(100)
                 .includes(:user)
                 .map { |event|
                   {
                     time: event.time,
                     user: event.user&.full_name,
                     name: event.name,
                     properties: event.properties
                   }
                 }
    end

    def invoice_activity_summary
      {
        created_today: Ahoy::Event.where(name: "create_invoice", time: Date.current.beginning_of_day..Date.current.end_of_day).count,
        sent_today: Ahoy::Event.where(name: "send_invoice", time: Date.current.beginning_of_day..Date.current.end_of_day).count,
        viewed_today: Ahoy::Event.where(name: "view_invoice", time: Date.current.beginning_of_day..Date.current.end_of_day).count,
        downloaded_today: Ahoy::Event.where(name: "download_invoice", time: Date.current.beginning_of_day..Date.current.end_of_day).count
      }
    end

    def payment_activity_summary
      {
        payments_today: Payment.where(transaction_date: Date.current).count,
        amount_collected_today: Payment.where(transaction_date: Date.current).sum { |p| p.base_currency_amount.to_f > 0 ? p.base_currency_amount : p.amount },
        stripe_payments: Payment.where(transaction_type: :stripe, transaction_date: Date.current.beginning_of_month..Date.current.end_of_month).count,
        bank_transfers: Payment.where(transaction_type: :bank_transfer, transaction_date: Date.current.beginning_of_month..Date.current.end_of_month).count
      }
    end

    def user_activity_summary
      {
        active_today: User.joins(:ahoy_events).where(ahoy_events: { time: Date.current.beginning_of_day..Date.current.end_of_day }).distinct.count,
        hours_logged_today: TimesheetEntry.where(work_date: Date.current).sum(:duration) / 60.0,
        most_active_users: User.joins(:ahoy_events)
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
                  .map { |rate|
                    {
                      date: rate.date,
                      from: rate.from_currency,
                      to: rate.to_currency,
                      rate: rate.rate,
                      source: rate.source
                    }
                  }
    end

    def recent_conversions
      Invoice.where.not(exchange_rate: nil)
             .order(created_at: :desc)
             .limit(20)
             .map { |invoice|
               {
                 invoice_number: invoice.invoice_number,
                 currency: invoice.currency,
                 amount: invoice.amount,
                 base_amount: invoice.base_currency_amount,
                 rate: invoice.exchange_rate,
                 date: invoice.exchange_rate_date
               }
             }
    end

    def currency_distribution
      Invoice.kept.group(:currency).count
    end

    def calculate_conversion_impact
      # Calculate how much was saved/lost due to exchange rate fluctuations
      invoices_with_conversion = Invoice.where.not(exchange_rate: nil)

      total_impact = invoices_with_conversion.sum { |invoice|
        current_rate = ExchangeRate.rate_for(invoice.currency, invoice.company.base_currency, Date.current)
        if current_rate
          (invoice.amount * current_rate) - invoice.base_currency_amount
        else
          0
        end
      }

      {
        total_impact: total_impact.round(2),
        positive_impact: total_impact > 0,
        affected_invoices: invoices_with_conversion.count
      }
    end

    def invoices_by_month_chart_data
      Invoice.kept
             .where(issue_date: 12.months.ago..Date.current)
             .group_by { |i| i.issue_date.strftime("%Y-%m") }
             .transform_values(&:count)
    end

    def hours_by_project_chart_data
      Project.joins(:timesheet_entries)
             .where(timesheet_entries: { work_date: 30.days.ago..Date.current })
             .group("projects.name")
             .sum("timesheet_entries.duration / 60.0")
             .sort_by { |_, hours| -hours }
             .first(10)
             .to_h
    end

    def top_clients_by_revenue(limit = 10)
      Client.joins(:invoices)
            .where(invoices: { status: :paid })
            .group("clients.name")
            .sum("CASE WHEN invoices.base_currency_amount > 0 THEN invoices.base_currency_amount ELSE invoices.amount END")
            .sort_by { |_, amount| -amount }
            .first(limit)
            .to_h
    end

    def calculate_payment_success_rate
      total_invoices = Invoice.kept.where(status: [:paid, :overdue]).count
      return 0 if total_invoices == 0

      paid_invoices = Invoice.kept.where(status: :paid).count
      ((paid_invoices.to_f / total_invoices) * 100).round(2)
    end

    def calculate_client_retention_rate
      # Simple retention: clients with invoices in both last year and this year
      last_year_clients = Client.joins(:invoices)
                                .where(invoices: { issue_date: 1.year.ago..6.months.ago })
                                .distinct
                                .pluck(:id)

      this_period_clients = Client.joins(:invoices)
                                  .where(invoices: { issue_date: 6.months.ago..Date.current })
                                  .distinct
                                  .pluck(:id)

      return 0 if last_year_clients.empty?

      retained = (last_year_clients & this_period_clients).count
      ((retained.to_f / last_year_clients.count) * 100).round(2)
    end

    def calculate_rate_variance(conversions)
      return 0 if conversions.empty?

      variances = conversions.filter_map { |invoice|
        expected = invoice.amount * invoice.exchange_rate
        actual = invoice.base_currency_amount
        ((actual - expected).abs / expected) * 100 if expected > 0
      }

      variances.sum / variances.count
    end
end

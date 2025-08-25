# frozen_string_literal: true

class Api::V1::Invoices::AnalyticsController < Api::V1::ApplicationController
  def monthly_revenue
    authorize Invoice, :index?

    # Get the date range for last 12 months
    end_date = Date.current.end_of_month
    start_date = 11.months.ago.beginning_of_month

    # Fetch all non-draft invoices within the date range
    invoices = current_company.invoices
      .kept
      .where.not(status: :draft)
      .where(issue_date: start_date..end_date)

    # Group by month and calculate revenue and payments
    monthly_data = {}

    # Initialize all months with zero revenue and payments
    12.times do |i|
      month_date = (11 - i).months.ago
      month_key = month_date.strftime("%b %Y")
      monthly_data[month_key] = {
        revenue: 0.0,
        payments: 0.0,
        invoice_count: 0,
        payment_count: 0,
        month: month_date.strftime("%b"),
        full_month: month_key,
        year: month_date.year
      }
    end

    # Process invoices and aggregate by month
    invoices.each do |invoice|
      month_key = invoice.issue_date.strftime("%b %Y")
      if monthly_data[month_key]
        # Use base_currency_amount if available, otherwise use amount
        amount = invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount.to_f : invoice.amount.to_f
        monthly_data[month_key][:revenue] += amount
        monthly_data[month_key][:invoice_count] += 1
      end
    end

    # Process payments for the same period
    payments = current_company.payments
      .joins(:invoice)
      .where(created_at: start_date..end_date)
      .where.not(status: ["failed", "cancelled"])

    payments.each do |payment|
      month_key = payment.created_at.strftime("%b %Y")
      if monthly_data[month_key]
        # Use the payment amount
        payment_amount = payment.amount.to_f
        monthly_data[month_key][:payments] += payment_amount
        monthly_data[month_key][:payment_count] += 1
      end
    end

    # Convert to array and sort by date
    chart_data = monthly_data.values.sort_by { |data|
      Date.parse("1 #{data[:full_month]}")
    }

    # Calculate statistics
    total_revenue = chart_data.sum { |d| d[:revenue] }
    average_revenue = chart_data.any? ? (total_revenue / chart_data.size) : 0

    # Calculate trend (comparing last month to previous month)
    trend = 0
    if chart_data.size >= 2
      last_month = chart_data[-1][:revenue]
      previous_month = chart_data[-2][:revenue]
      trend = previous_month > 0 ? ((last_month - previous_month) / previous_month * 100) : 0
    end

    # Get current period stats for quick access
    current_month_revenue = chart_data.last&.dig(:revenue) || 0
    current_month_count = chart_data.last&.dig(:invoice_count) || 0

    render json: {
      chart_data: chart_data,
      statistics: {
        total_revenue: total_revenue,
        average_revenue: average_revenue,
        trend: trend.round(2),
        current_month_revenue: current_month_revenue,
        current_month_invoices: current_month_count,
        currency: current_company.base_currency
      },
      period: {
        start_date: start_date.strftime("%b %Y"),
        end_date: end_date.strftime("%b %Y")
      }
    }
  end

  def revenue_by_status
    authorize Invoice, :index?

    # Get revenue grouped by status for current year
    current_year = Date.current.year
    start_date = Date.new(current_year, 1, 1)
    end_date = Date.current

    revenue_by_status = current_company.invoices
      .kept
      .where(issue_date: start_date..end_date)
      .group(:status)
      .sum(:base_currency_amount)

    # Format the response
    status_data = Invoice.statuses.keys.map do |status|
      {
        status: status,
        revenue: revenue_by_status[status] || 0,
        label: status.humanize.upcase
      }
    end

    render json: {
      status_data: status_data,
      total: revenue_by_status.values.sum,
      currency: current_company.base_currency,
      period: {
        start_date: start_date.strftime("%b %d, %Y"),
        end_date: end_date.strftime("%b %d, %Y")
      }
    }
  end
end

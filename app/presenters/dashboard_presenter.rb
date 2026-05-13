# frozen_string_literal: true

class DashboardPresenter
  attr_reader :company, :current_user, :timeframe, :from_date, :to_date

  def initialize(company:, current_user:, timeframe: "year", from_date: nil, to_date: nil)
    @company = company
    @current_user = current_user
    @timeframe = timeframe.presence || "year"
    @to_date = to_date || Date.current
    @from_date = from_date || calculate_from_date
  end

  def fiscal_year_end_month
    return 12 unless company.fiscal_year_end.present?

    # Map month names to month numbers
    month_mapping = {
      "january" => 1, "jan" => 1,
      "february" => 2, "feb" => 2,
      "march" => 3, "mar" => 3,
      "april" => 4, "apr" => 4,
      "may" => 5,
      "june" => 6, "jun" => 6,
      "july" => 7, "jul" => 7,
      "august" => 8, "aug" => 8,
      "september" => 9, "sep" => 9, "sept" => 9,
      "october" => 10, "oct" => 10,
      "november" => 11, "nov" => 11,
      "december" => 12, "dec" => 12
    }

    fiscal_year_end = company.fiscal_year_end.downcase.strip
    parsed_month = month_mapping[fiscal_year_end]
    return parsed_month if parsed_month

    Rails.logger.warn(
      "[DashboardPresenter] Invalid fiscal_year_end=#{company.fiscal_year_end.inspect} for company_id=#{company.id}; defaulting to 12"
    )
    12
  end

  def data
    {
      stats: stats_data,
      revenue_chart: revenue_chart_data,
      revenue_by_customer: revenue_by_customer_data,
      recent_activities: recent_activities_data,
      upcoming_tasks: upcoming_tasks_data
    }
  end

  private

    def calculate_from_date
      case timeframe
      when "week"
        to_date.beginning_of_week
      when "quarter"
        to_date.beginning_of_quarter
      when "month"
        to_date.beginning_of_month
      when "year"
        # Use fiscal year if configured, otherwise calendar year
        fiscal_end_month = fiscal_year_end_month
        fiscal_start_month = fiscal_end_month == 12 ? 1 : fiscal_end_month + 1

        # Determine the fiscal year start date
        if to_date.month >= fiscal_start_month
          # We're in the current fiscal year
          Date.new(to_date.year, fiscal_start_month, 1)
        else
          # We're in the previous fiscal year
          Date.new(to_date.year - 1, fiscal_start_month, 1)
        end
      else
        to_date.beginning_of_year
      end
    end

    def stats_data
      invoices = scoped_invoices
      period_invoices = invoices.where(issue_date: from_date..to_date)

      if client_scoped?
        paid_invoices = period_invoices.paid.count
        open_invoices = period_invoices.where(status: [:sent, :viewed, :overdue]).count
        outstanding_amount = period_invoices.sum(:amount_due)
        payments_received = scoped_payments.where(transaction_date: from_date..to_date).sum(:amount)

        return {
          total_revenue: amount_value(period_invoices.sum(:amount)),
          revenue_trend: trend_value(calculate_trend(period_invoices.sum(:amount), calculate_previous_period_revenue)),
          active_projects: open_invoices,
          projects_trend: 0,
          team_size: paid_invoices,
          billable_hours: amount_value(payments_received),
          hours_trend: 0,
          outstanding_amount: amount_value(outstanding_amount),
          payments_received: amount_value(payments_received),
          paid_invoices: paid_invoices,
          open_invoices: open_invoices,
          currency: company.base_currency
        }
      end

      # Calculate revenue
      total_revenue = employee_scoped? ? 0 : period_invoices.sum(:amount)
      previous_period_revenue = employee_scoped? ? 0 : calculate_previous_period_revenue
      revenue_trend = employee_scoped? ? 0 : calculate_trend(total_revenue, previous_period_revenue)

      active_projects = active_project_count_for(from_date..to_date)
      previous_active_projects = active_project_count_for(previous_period_range)
      projects_trend = calculate_trend(active_projects, previous_active_projects)

      # Calculate hours
      billable_hours = calculate_billable_hours
      previous_billable_hours = calculate_previous_billable_hours
      hours_trend = calculate_trend(billable_hours, previous_billable_hours)

      {
        total_revenue: amount_value(total_revenue),
        revenue_trend: trend_value(revenue_trend),
        active_projects: active_projects,
        projects_trend: trend_value(projects_trend),
        team_size: team_size,
        billable_hours: amount_value(billable_hours),
        hours_trend: trend_value(hours_trend),
        currency: company.base_currency
      }
      end

    def revenue_chart_data
      return [] if employee_scoped?

      monthly_data = scoped_invoices
        .where(issue_date: from_date..to_date)
        .group(Arel.sql("DATE_TRUNC('month', issue_date)"))
        .sum(:amount)

      # Build chart data with cumulative revenue
      chart_data = []
      current_date = from_date.beginning_of_month
      cumulative_revenue = 0

      while current_date <= to_date
        month_revenue = (monthly_data[current_date.beginning_of_month.in_time_zone] || 0).to_f
        cumulative_revenue += month_revenue

        chart_data << {
          month: current_date.strftime("%b"),
          full_month: current_date.strftime("%B %Y"),
          year: current_date.year,
          revenue: amount_value(cumulative_revenue),
          monthly_revenue: amount_value(month_revenue),
          invoices: invoice_count_for_month(current_date)
        }
        current_date = current_date.next_month
      end

      chart_data
    end

    def revenue_by_customer_data
      return [] if employee_scoped? || client_scoped?

      client_data = scoped_invoices
        .joins(:client)
        .where(issue_date: from_date..to_date)
        .group("clients.id", "clients.name")
        .sum(:amount)
        .map do |(client_id, client_name), amount|
        {
          id: client_id,
          name: client_name || "Unknown",
          revenue: amount_value(amount)
        }
      end

      # Sort and take top 6
      total_revenue = client_data.sum { |c| c[:revenue] }

      client_data
        .sort_by { |c| -c[:revenue] }
        .first(6)
        .map do |client|
          client.merge(
            percentage: total_revenue > 0 ? ((client[:revenue] / total_revenue) * 100).round : 0
          )
        end
    end

    def recent_activities_data
      return [] if employee_scoped?

      activities = []

      # Recent invoices
      recent_invoices = scoped_invoices
                              .includes(:client)
                              .order(created_at: :desc)
                              .limit(2)

      recent_invoices.each do |invoice|
        activities << {
          id: "invoice_#{invoice.id}",
          type: "invoice",
          message: "Invoice ##{invoice.invoice_number} #{invoice.status} - #{invoice.client&.name}",
          time: time_ago_in_words(invoice.created_at),
          icon: "FileText",
          color: "text-blue-600",
          bg_color: "bg-blue-50"
        }
      end

      # Recent projects
      recent_projects = scoped_projects
                              .order(created_at: :desc)
                              .limit(2)

      recent_projects.each do |project|
        activities << {
          id: "project_#{project.id}",
          type: "project",
          message: "Project '#{project.name}' #{project.billable? ? 'billable' : 'non-billable'}",
          time: time_ago_in_words(project.created_at),
          icon: "Briefcase",
          color: "text-purple-600",
          bg_color: "bg-purple-50"
        }
      end

      activities.sort_by { |a| a[:time] }
    end

    def upcoming_tasks_data
      # This would come from a tasks/calendar system if available
      # For now, return sample structure
      []
    end

    def calculate_billable_hours
      timesheet_entries = scoped_timesheet_entries.where(work_date: from_date..to_date)

      timesheet_entries.sum(:duration).to_f / 60 # Convert minutes to hours
    end

    def calculate_previous_billable_hours
      previous_from, previous_to = previous_period_bounds

      timesheet_entries = scoped_timesheet_entries.where(work_date: previous_from..previous_to)

      timesheet_entries.sum(:duration).to_f / 60
    end

    def calculate_previous_period_revenue
      previous_from, previous_to = previous_period_bounds

      scoped_invoices.where(issue_date: previous_from..previous_to).sum(:amount)
    end

    def calculate_trend(current_value, previous_value)
      return 0 if previous_value == 0

      ((current_value.to_f - previous_value.to_f) / previous_value.to_f * 100).round(1)
    end

    def previous_period_range
      previous_from, previous_to = previous_period_bounds
      previous_from..previous_to
    end

    def previous_period_bounds
      current_span = to_date - from_date

      case timeframe
      when "year"
        previous_from = from_date.prev_year
        previous_to = previous_from + current_span
      when "quarter"
        previous_from = from_date << 3
        previous_to = previous_from + current_span
      when "month"
        previous_from = from_date.prev_month
        previous_to = previous_from + current_span
      when "week"
        previous_from = from_date - 7.days
        previous_to = previous_from + current_span
      else
        previous_to = from_date - 1.day
        previous_from = previous_to - current_span
      end

      [previous_from, previous_to]
    end

    def active_project_count_for(date_range)
      scoped_timesheet_entries.where(work_date: date_range).distinct.count(:project_id)
    end

    def invoice_count_for_month(date)
      scoped_invoices.where(issue_date: date.beginning_of_month..date.end_of_month).count
    end

    def time_ago_in_words(time)
      seconds = Time.current - time

      case seconds
      when 0..59
        "just now"
      when 60..3599
        "#{(seconds / 60).to_i} minutes ago"
      when 3600..86399
        "#{(seconds / 3600).to_i} hours ago"
      when 86400..604799
        "#{(seconds / 86400).to_i} days ago"
      else
        time.strftime("%b %d")
      end
    end

    def client_scoped?
      current_user.has_role?(:client, company)
    end

    def accessible_client_ids
      @accessible_client_ids ||= if client_scoped?
        current_user.client_members.kept.where(company: company).select(:client_id)
      else
        company.clients.kept.select(:id)
      end
    end

    def scoped_invoices
      company.invoices.kept.where(client_id: accessible_client_ids)
    end

    def scoped_projects
      scope = company.projects.where(client_id: accessible_client_ids)
      return scope unless employee_scoped?

      scope.joins(:project_members).merge(current_user.project_members.kept).distinct
    end

    def scoped_timesheet_entries
      scope = company.timesheet_entries.joins(:project).where(projects: { client_id: accessible_client_ids })
      return scope unless employee_scoped?

      scope.where(user: current_user)
    end

    def scoped_payments
      company.payments.joins(:invoice).where(invoices: { client_id: accessible_client_ids })
    end

    def team_size
      return 1 if employee_scoped?
      return company.employments.kept.count unless client_scoped?

      scoped_projects.joins(:project_members).distinct.count("project_members.user_id")
    end

    def employee_scoped?
      current_user.has_role?(:employee, company)
    end

    def amount_value(amount)
      amount.to_f.round(2)
    end

    def trend_value(value)
      value.to_f.round(1)
    end
end

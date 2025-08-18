# frozen_string_literal: true

class DashboardPresenter
  attr_reader :company, :timeframe, :from_date, :to_date

  def initialize(company:, timeframe: "year", from_date: nil, to_date: nil)
    @company = company
    @timeframe = "year" # Always use year for consistent annual view
    @to_date = to_date || Date.current
    @from_date = from_date || Date.current - 1.year
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
        Date.current - 7.days
      when "month"
        Date.current - 1.month
      when "year"
        Date.current - 1.year
      else
        Date.current - 1.month
      end
    end

    def stats_data
      invoices = company.invoices.kept
      period_invoices = invoices.where(issue_date: from_date..to_date)

      # Calculate revenue
      total_revenue = period_invoices.sum(:amount)
      previous_period_revenue = calculate_previous_period_revenue
      revenue_trend = calculate_trend(total_revenue, previous_period_revenue)

      # Calculate projects
      active_projects = company.projects.where(billable: true).count
      previous_active_projects = calculate_previous_active_projects
      projects_trend = calculate_trend(active_projects, previous_active_projects)

      # Calculate hours
      billable_hours = calculate_billable_hours
      previous_billable_hours = calculate_previous_billable_hours
      hours_trend = calculate_trend(billable_hours, previous_billable_hours)

      {
        total_revenue: total_revenue.round(2),
        revenue_trend: revenue_trend,
        active_projects: active_projects,
        projects_trend: projects_trend,
        team_size: company.users.count,
        billable_hours: billable_hours,
        hours_trend: hours_trend,
        currency: company.base_currency
      }
    end

    def revenue_chart_data
      invoices = company.invoices.kept.where(issue_date: from_date..to_date)

      # Group by month
      monthly_data = invoices.group_by { |i| i.issue_date.beginning_of_month }

      # Build chart data
      chart_data = []
      current_date = from_date.beginning_of_month

      while current_date <= to_date
        month_invoices = monthly_data[current_date] || []
        chart_data << {
          month: current_date.strftime("%b"),
          revenue: month_invoices.sum(&:amount).round(2),
          invoices: month_invoices.count
        }
        current_date = current_date.next_month
      end

      chart_data
    end

    def revenue_by_customer_data
      invoices = company.invoices.kept.where(issue_date: from_date..to_date)

      # Group by client
      client_revenue = invoices.includes(:client).group_by(&:client)

      # Calculate revenue per client
      client_data = client_revenue.map do |client, client_invoices|
        {
          name: client&.name || "Unknown",
          revenue: client_invoices.sum(&:amount).round(2)
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
      activities = []

      # Recent invoices
      recent_invoices = company.invoices.kept
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
      recent_projects = company.projects
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
      # Calculate from timesheet entries
      timesheet_entries = company.timesheet_entries
                                .where(work_date: from_date..to_date)

      timesheet_entries.sum(:duration).to_f / 60 # Convert minutes to hours
    end

    def calculate_previous_billable_hours
      previous_from = from_date - (to_date - from_date).days
      previous_to = from_date - 1.day

      timesheet_entries = company.timesheet_entries
                                .where(work_date: previous_from..previous_to)

      timesheet_entries.sum(:duration).to_f / 60
    end

    def calculate_previous_period_revenue
      previous_from = from_date - (to_date - from_date).days
      previous_to = from_date - 1.day

      company.invoices.kept
            .where(issue_date: previous_from..previous_to)
            .sum(:amount)
    end

    def calculate_previous_active_projects
      # For simplicity, return current count minus 1
      [company.projects.where(billable: true).count - 1, 0].max
    end

    def calculate_trend(current_value, previous_value)
      return 0 if previous_value == 0

      ((current_value - previous_value) / previous_value * 100).round(1)
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
end

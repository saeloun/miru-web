# frozen_string_literal: true

class Reports::ClientRevenues::ReportDecorator < ApplicationService
  attr_reader :params, :current_company

  def initialize(params, current_company)
    @params = params
    @current_company = current_company
  end

  def process
    {
      client_revenues: client_revenues_data,
      summary: summary_data,
      filters: filters
    }
  end

  private

    def from_date
      @from_date ||= begin
        date_param = params[:from] || params[:from_date]
        date_param.present? ? Date.parse(date_param.to_s) : 1.month.ago.beginning_of_month
      end
    end

    def to_date
      @to_date ||= begin
        date_param = params[:to] || params[:to_date]
        date_param.present? ? Date.parse(date_param.to_s) : Date.current.end_of_month
      end
    end

    def client_ids
      @client_ids ||= if params[:client_ids].present?
        if params[:client_ids].is_a?(String)
          JSON.parse(params[:client_ids])
        else
          params[:client_ids]
        end
      else
        []
      end
    end

    def clients
      @clients ||= begin
        scope = current_company.billable_clients
        client_ids.present? ? scope.where(id: client_ids) : scope
      end
    end

    def client_revenues_data
      @client_revenues_data ||= clients.includes(:invoices, :projects).map do |client|
        build_client_revenue_data(client)
      end.sort_by { |data| data[:name] }
    end

    def build_client_revenue_data(client)
      invoices = client.invoices.kept.where(issue_date: from_date..to_date)

      # Use base currency amounts for consistent reporting
      paid_amount = calculate_sum_in_base_currency(invoices.where(status: "paid"))
      overdue_amount = calculate_sum_in_base_currency(invoices.where(status: "overdue"))
      outstanding_amount = calculate_sum_in_base_currency(invoices.where(status: ["sent", "viewed"]))

      {
        id: client.id,
        name: client.name,
        logo: client.logo_url,
        revenue: calculate_sum_in_base_currency(invoices),
        paid_amount: paid_amount || 0,
        overdue_amount: overdue_amount || 0,
        outstanding_amount: outstanding_amount || 0,
        hours_logged: calculate_hours_logged(client),
        currency: current_company.base_currency  # Always report in base currency
      }
    end

    def calculate_hours_logged(client)
      minutes = client.timesheet_entries
        .joins(:project)
        .where(work_date: from_date..to_date)
        .where(timesheet_entries: { discarded_at: nil })
        .sum(:duration)

      (minutes / 60.0).round(2)
    end

    def summary_data
      total_paid = client_revenues_data.sum { |c| c[:paid_amount] }
      total_outstanding = client_revenues_data.sum { |c| c[:outstanding_amount] + c[:overdue_amount] }
      {
        total_revenue: total_paid + total_outstanding,
        total_paid_amount: total_paid,
        total_paid: total_paid, # For compatibility with specs
        total_outstanding_amount: total_outstanding,
        total_outstanding: total_outstanding, # For compatibility with specs
        total_hours: client_revenues_data.sum { |c| c[:hours_logged] },
        currency: current_company.base_currency
      }
    end

    def filters
      {
        from: from_date,
        to: to_date,
        client_ids: client_ids
      }
    end

    def calculate_sum_in_base_currency(invoices)
      invoices.sum do |invoice|
        # Use base_currency_amount if available and greater than 0, otherwise use amount
        if invoice.base_currency_amount.to_f > 0.00
          invoice.base_currency_amount
        else
          invoice.amount
        end
      end
    end
end

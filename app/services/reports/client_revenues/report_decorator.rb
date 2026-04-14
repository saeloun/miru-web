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
      filters: filters,
      filter_options: filter_options
    }
  end

  private

    def from_date
      @from_date ||= begin
        date_param = params[:from] || params[:from_date]
        if date_param.present?
          Date.parse(date_param.to_s)
        else
          # Default to all time if no date params provided
          nil
        end
      end
    end

    def to_date
      @to_date ||= begin
        date_param = params[:to] || params[:to_date]
        if date_param.present?
          Date.parse(date_param.to_s)
        else
          # Default to all time if no date params provided
          nil
        end
      end
    end

    def client_ids
      @client_ids ||= if params[:client_ids].present?
        if params[:client_ids].is_a?(String)
          value = params[:client_ids].to_s
          value.strip.start_with?("[") ? JSON.parse(value) : value.split(",").map(&:strip)
        else
          params[:client_ids]
        end
      else
        []
      end
    end

    def client_revenues_data
      @client_revenues_data ||= client_records.map do |client|
        build_client_revenue_data(client)
      end.sort_by { |data| data[:name].to_s.downcase }
    end

    def build_client_revenue_data(client)
      amounts = invoice_amounts_by_client[client.id]

      {
        id: client.id,
        name: client.name,
        logo: client.logo_url,
        revenue: amounts[:revenue].round(2),
        paid_amount: amounts[:paid].round(2),
        overdue_amount: amounts[:overdue].round(2),
        outstanding_amount: amounts[:outstanding].round(2),
        hours_logged: hours_logged_by_client[client.id] || 0,
        currency: current_company.base_currency  # Always report in base currency
      }
    end

    def client_records
      @client_records ||= begin
        scope = billable_client_records
        return scope if client_ids.blank?

        scope.where(id: client_ids)
      end
    end

    def billable_client_records
      @billable_client_records ||= current_company.billable_clients.with_attached_logo
    end

    def summary_data
      total_paid = client_revenues_data.sum { |c| c[:paid_amount] }
      total_outstanding = client_revenues_data.sum { |c| c[:outstanding_amount] + c[:overdue_amount] }
      {
        total_revenue: (total_paid + total_outstanding).round(2),
        total_paid_amount: total_paid.round(2),
        total_paid: total_paid.round(2), # For compatibility with specs
        total_outstanding_amount: total_outstanding.round(2),
        total_outstanding: total_outstanding.round(2), # For compatibility with specs
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

    def filter_options
      {
        clients: billable_client_records.order(name: :asc)
      }
    end

    def invoice_amounts_by_client
      @invoice_amounts_by_client ||= begin
        grouped = Hash.new do |hash, client_id|
          hash[client_id] = { paid: 0, overdue: 0, outstanding: 0, revenue: 0 }
        end

        invoice_scope.find_each do |invoice|
          value =
            if invoice.base_currency_amount.to_f.positive?
              invoice.base_currency_amount.to_f
            else
              invoice.amount.to_f
            end

          grouped[invoice.client_id][:revenue] += value

          case invoice.status
          when "paid"
            grouped[invoice.client_id][:paid] += value
          when "overdue"
            grouped[invoice.client_id][:overdue] += value
          when "sent", "viewed"
            grouped[invoice.client_id][:outstanding] += value
          end
        end

        grouped
      end
    end

    def invoice_scope
      @invoice_scope ||= begin
        scope = Invoice.kept.where(client_id: client_records.map(&:id))
        from_date.present? && to_date.present? ? scope.where(issue_date: from_date..to_date) : scope
      end
    end

    def hours_logged_by_client
      @hours_logged_by_client ||= begin
        scope = TimesheetEntry.kept.joins(:project).where(projects: { client_id: client_records.map(&:id) })
        scope = scope.where(work_date: from_date..to_date) if from_date.present? && to_date.present?

        scope.group("projects.client_id").sum(:duration).transform_values do |minutes|
          (minutes / 60.0).round(2)
        end
      end
    end
end

# frozen_string_literal: true

require "csv"

module Reports
  class CompensationProfitabilityCsv
    COLUMNS = {
      primary_project: "Primary Project", person: "Person", department: "Department", status: "Employment Status",
      effective_rate: "Effective Billing Rate", total_hours: "Hours — Total Worked", billable_hours: "Billable Hours",
      available_hours: "Available Hours", utilization: "Utilization %", annual_compensation: "Annual Compensation",
      compensation_currency: "Compensation Currency", days_to_yearly_salary: "Days to Yearly Salary",
      salary_inr: "Salary in INR", salary_usd: "Salary in USD", revenue: "Revenue", compensation_cost: "Compensation Cost",
      margin: "Margin Amount", margin_percentage: "Margin %", flags: "Data Quality Flags"
    }.freeze
    TEXT_COLUMNS = %i[primary_project person department status compensation_currency flags].freeze

    def self.process(report)
      report = report.deep_symbolize_keys
      CSV.generate do |csv|
        csv << [report[:title]]
        csv << ["Generated at", report[:generated_at], "Reporting currency", report[:currency]]
        csv << ["Period", report[:from], report[:to], "Provisional", report[:provisional], "Incomplete", report[:incomplete]]
        csv << ["Payroll proration", report[:proration] || "N/A"]
        csv << ["Filters", safe(report[:filters].to_json)]
        report[:notes].each { |note| csv << [note] }
        csv << []
        csv << COLUMNS.values
        report[:people].each do |row|
          csv << COLUMNS.keys.map do |key|
            value = row[key]
            value = value.join("; ") if value.is_a?(Array)
            TEXT_COLUMNS.include?(key) ? safe(value) : numeric(value)
          end
        end
        [report, report[:comparison]].each do |period|
          csv << []
          csv << ["Summary", period[:from], period[:to]]
          period[:summary].each { |key, value| csv << [key.to_s.humanize, numeric(value)] }
        end
        csv << []
        csv << ["FX from", "FX to", "Rate", "Rate date", "Source", "Inverse"]
        report[:exchange_rates].each do |rate|
          csv << [rate[:from], rate[:to], rate[:rate], rate[:date], safe(rate[:source]), rate[:inverse]]
        end
        csv << []
        csv << ["Person", "Project", "Client", "Date", "Hours", "Billable", "Billing method", "Hourly rate", "Rate currency", "Rate effective on", "Revenue"]
        report[:people].each do |row|
          row[:projects].each do |project|
            project[:entries].each do |entry|
              csv << [safe(row[:person]), safe(project[:project]), safe(project[:client]), entry[:date], numeric(entry[:hours]),
                entry[:billable], entry[:billing_method], numeric(entry[:hourly_rate]), entry[:rate_currency],
                entry[:rate_effective_on], numeric(entry[:revenue])]
            end
          end
        end
        csv << []
        csv << ["Person", "Compensation effective on", "Monthly compensation", "Currency", "Source"]
        report[:people].each do |row|
          row[:compensation_changes].each do |change|
            csv << [safe(row[:person]), change[:effective_on], numeric(change[:monthly_amount]), change[:currency], change[:source]]
          end
        end
      end
    end

    def self.safe(value)
      text = value.nil? ? "N/A" : value.to_s
      text.match?(/\A[[:space:]]*[=+@-]/) ? "'#{text}" : text
    end

    def self.numeric(value)
      value.nil? ? "N/A" : value.to_d.round(2).to_s("F")
    end
  end
end

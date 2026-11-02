# frozen_string_literal: true

require "csv"

module Reports
  class ProfitabilityPlanCsv
    def self.process(scenario)
      CSV.generate do |csv|
        csv << [safe(scenario.name), "Planning assumptions, not actual payroll or collected revenue", scenario.updated_at.iso8601]
        write_source(csv, scenario.worksheet["source"])
        %w[baseline assumptions].each do |key|
          input = scenario.worksheet.fetch(key)
          write_period(csv, input, key == "baseline" ? "First saved baseline" : "Saved scenario")
        end
      end
    end

    def self.write_source(csv, source)
      return unless source

      csv << ["Source captured", source["captured_at"], "Actuals from", source["from"], "Actuals to", source["to"], "FX as of", source["conversion_date"]]
      source.fetch("people", []).each { |person| csv << ["Original source warnings", safe(person["name"]), person["flags"].join("; ")] }
      source.fetch("exchange_rates", []).each do |rate|
        csv << ["Source FX", rate["from"], rate["to"], rate["rate"], rate["date"], safe(rate["source"])]
      end
    end

    def self.write_period(csv, input, title)
      result = ProfitabilityProjection.new(input).process
      csv << [title, input.fetch("currency")]
      csv << ["Start month", input["start_month"], "Months", input["months"], "Reserve months", input["reserve_months"]]
      result[:summary].each { |metric, value| csv << [metric.to_s.humanize, value.nil? ? "N/A" : value.to_s("F")] }
      result[:totals].each { |metric, value| csv << ["Forecast total #{metric}", value.nil? ? "N/A" : value.to_s("F")] }
      write_people(csv, input, result)
      csv << ["Overhead", "Monthly amount"]
      result[:overheads].each { |row| csv << [safe(row[:name]), row[:amount]&.to_s("F") || "N/A"] }
      write_months(csv, result[:months])
    end

    def self.write_months(csv, months)
      csv << ["Month", "Revenue", "Cost", "Margin", "Closing cash"]
      months.each { |month| csv << [month[:month], *month.values_at(:revenue, :cost, :margin, :closing_cash).map { |value| value&.to_s("F") || "N/A" }] }
    end

    def self.write_people(csv, input, result)
      csv << ["Person", "Monthly capacity", "Target utilization %", "Hourly rate", "Monthly compensation", "Monthly revenue", "Monthly margin", "Data quality"]
      result[:people].zip(input.fetch("people")).each do |row, source|
        csv << [safe(row[:name]), source["capacity_hours"], source["utilization"], source["billing_rate"], source["monthly_compensation"],
          row[:revenue]&.to_s("F") || "N/A", row[:margin]&.to_s("F") || "N/A", row[:flags].join("; ")]
      end
    end

    def self.safe(value)
      value.to_s.match?(/\A[\s]*[=+\-@]/) ? "'#{value}" : value
    end
  end
end

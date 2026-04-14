# frozen_string_literal: true

module DateRangeParamParsing
  private

    def parsed_date_param(key)
      parsed_date_params[key]
    end

    def parsed_date_params
      @parsed_date_params ||= begin
        parsed_values = {
          from: parse_date_value(params[:from]),
          to: parse_date_value(params[:to])
        }

        from_candidates = parsed_values[:from]
        to_candidates = parsed_values[:to]

        if from_candidates.is_a?(Array) && to_candidates.is_a?(Array)
          best_pair = from_candidates.product(to_candidates)
            .select { |from_date, to_date| from_date <= to_date }
            .min_by { |from_date, to_date| (to_date - from_date).to_i.abs }

          if best_pair
            parsed_values[:from], parsed_values[:to] = best_pair
          end
        end

        parsed_values.transform_values do |value|
          value.is_a?(Array) ? value.first : value
        end
      end
    end

    def parse_date_value(value)
      return if value.blank?

      string_value = value.to_s
      return Date.iso8601(string_value) if string_value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

      parsed_dates = date_formats.filter_map do |format|
        parsed_date = Date.strptime(string_value, format)
        parsed_date if parsed_date.strftime(format) == string_value
      rescue ArgumentError
        nil
      end.uniq

      return parsed_dates if parsed_dates.any?

      Date.iso8601(string_value)
    rescue ArgumentError
      nil
    end

    def date_formats
      [
        company_date_format_for_strptime,
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y"
      ].compact.uniq
    end

    def company_date_format_for_strptime
      {
        "DD-MM-YYYY" => "%d-%m-%Y",
        "MM-DD-YYYY" => "%m-%d-%Y",
        "YYYY-MM-DD" => "%Y-%m-%d"
      }[current_company.date_format]
    end
end

# frozen_string_literal: true

module Analytics
  module Exports
    class DownloadService < ApplicationService
      def initialize(report_type:, format:, company:, filters: {})
        @report_type = report_type.to_s
        @format = format.to_s
        @company = company
        @filters = filters.deep_symbolize_keys
      end

      def process
        case format
        when "csv"
          Reports::GenerateCsv.new(*csv_content).process
        when "pdf"
          Analytics::Exports::PdfService.new(export_payload, company).process
        else
          raise ArgumentError, "Unsupported export format: #{format}"
        end
      end

      def filename
        "#{report_type}_analytics_#{Date.current}.#{format}"
      end

      def content_type
        format == "pdf" ? "application/pdf" : "text/csv"
      end

      private

        attr_reader :report_type, :format, :company, :filters

        def report_payload
          @report_payload ||= Analytics::QueryService.process(report_type:, company:, filters:)
        end

        def export_payload
          @export_payload ||= Analytics::Exports::Formatter.new(
            report_type:,
            payload: report_payload,
            company:,
            filters:
          ).export_payload
        end

        def csv_content
          rows = []
          export_payload[:summary_rows].each { |row| rows << row }

          export_payload[:tables].each do |table|
            rows << [] if rows.any?
            rows << [table[:title]]
            rows.concat(table[:rows])
          end

          headers = ["Metric", "Value"]
          first_table = export_payload[:tables].first
          if first_table
            rows = export_payload[:summary_rows].dup
            export_payload[:tables].each do |table|
              rows << [] if rows.any?
              rows << [table[:title]]
              rows << table[:headers]
              rows.concat(table[:rows])
            end
          end

          [rows, headers]
        end
    end
  end
end

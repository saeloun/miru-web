# frozen_string_literal: true

class Reports::ShareService
  attr_reader :report_type, :report_data, :current_company, :recipients, :subject, :message

  def initialize(report_type, report_data, current_company, recipients, subject, message)
    @report_type = report_type
    @report_data = report_data
    @current_company = current_company
    @recipients = recipients
    @subject = subject
    @message = message
  end

  def process
    report_file = generate_report_file
    send_email(report_file)
  end

  private

    def generate_report_file
      case report_type
      when :time_entries, :accounts_aging
        Reports::GeneratePdf.new(report_type, report_data, current_company).process
      else
        raise ArgumentError, "Unsupported report type: #{report_type}"
      end
    end

    def send_email(report_file)
      ShareReportMailer.with(
        recipients:,
        subject:,
        message:,
        pdf_data: report_file,
        filename: "#{report_type}_report.pdf"
      ).share_report.deliver_now
      # ShareReportMailer.share_report(recipients, subject, message, report_file).deliver_now
    end
end

# frozen_string_literal: true

class ShareReportMailer < ApplicationMailer
  def share_report
    # @message = message

    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]
    pdf_data = params[:pdf_data]
    filename = params[:filename]

    attachments[filename] = pdf_data
    mail(to: recipients, subject:)
    # attachments[report_file['filename']] = File.read(report_file['path'])
    # mail(to: recipients, subject: subject, body: message)
  end
end

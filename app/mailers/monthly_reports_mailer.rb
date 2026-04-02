# frozen_string_literal: true

class MonthlyReportsMailer < ApplicationMailer
  def cash_flow_digest
    @company = Company.find(params[:company_id])
    @recipient = User.find_by(id: params[:recipient_id])
    @month = params[:month].present? ? Date.parse(params[:month].to_s) : Date.current.prev_month
    @digest = Reports::MonthlyCashFlowDigest.new(company: @company, month: @month).process
    @reports_url = "#{ENV['APP_BASE_URL']}/reports"
    recipients = Array(params[:recipients]).presence || Array(@recipient&.email)
    with_recipient_locale(@recipient) do
      mail(
        to: recipients,
        subject: I18n.t(
          "mailers.monthly_reports_mailer.cash_flow_digest.subject",
          company_name: @company.name,
          month_label: @digest[:month_label]
        ),
        reply_to: ENV["REPLY_TO_EMAIL"]
      )
    end
  end
end

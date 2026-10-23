# frozen_string_literal: true

class SalarySlipMailer < ApplicationMailer
  rescue_from Postmark::InactiveRecipientError do |exception|
    raise exception
  end

  def published
    @slip = params[:slip]
    @company = @slip.company
    @month = @slip.pay_month.strftime("%Y-%m")
    base_url = ENV["APP_BASE_URL"].presence || "https://#{default_url_options.fetch(:host)}"
    @archive_url = "#{base_url}/salary-slips?company_id=#{@company.id}&month=#{@month}"
    mail(to: params[:recipient], subject: "Your salary slip for #{@month} is available")
  end
end

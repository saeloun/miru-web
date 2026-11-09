# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- Delivery instrumentation must omit private mail bodies and recipient data.
class PayrollPtoMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  include PrivateMailDelivery
  default from: ApplicationMailer.default.fetch(:from), reply_to: ApplicationMailer.default.fetch(:reply_to)

  def review(id)
    notice = PayrollPtoNotification.find(id)
    own_correction = notice.kind == "correction" && notice.employment.user_id == notice.recipient_id
    path = own_correction ? "/time-tracking" : "/consultant-payroll"
    url = "#{root_url.delete_suffix('/')}#{path}"
    mail(to: notice.recipient.email, subject: "Payroll leave review required", message_id: "payroll-pto-#{notice.id}@miru",
      body: "A payroll leave #{notice.kind.humanize.downcase} review needs your attention. Sign in to the correct workspace and review the recorded source and decisions: #{url}", content_type: "text/plain")
  end
end

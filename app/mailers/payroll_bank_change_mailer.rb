# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- Private delivery instrumentation excludes bodies and recipients.
class PayrollBankChangeMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  include PrivateMailDelivery
  default from: ApplicationMailer.default.fetch(:from), reply_to: ApplicationMailer.default.fetch(:reply_to)

  def changed(id)
    notice = PayrollBankChangeNotice.find(id)
    url = "#{root_url.delete_suffix('/')}/payroll"
    mail(to: notice.recipient.email, subject: "Consultant bank details need review",
      body: "Consultant bank details changed. Sign in to the correct workspace and reverify the current bank details before preparing a new payment: #{url}\nExisting submitted payments retain their original destination. This notice does not verify an account or initiate a payment.",
      content_type: "text/plain")
  end
end

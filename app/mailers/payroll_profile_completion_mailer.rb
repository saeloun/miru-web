# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- Private delivery instrumentation excludes bodies and recipients.
class PayrollProfileCompletionMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  include PrivateMailDelivery
  default from: ApplicationMailer.default.fetch(:from), reply_to: ApplicationMailer.default.fetch(:reply_to)

  # Link to the stored consultant's workspace-bound forms without embedding private profile facts.
  def requested(id)
    request = PayrollProfileCompletionRequest.find(id)
    base = root_url.delete_suffix("/")
    links = request.categories.map do |category|
      if category == "bank_details"
        "Review bank details (including SWIFT for US-funded payments): #{base}/settings/employee-records?company_id=#{request.company_id}"
      else
        "Complete or correct your billing identity: #{base}/settings/billing-identity?company_id=#{request.company_id}"
      end
    end
    mail(to: request.recipient.email, subject: "Review your consultant payroll details",
      body: "#{request.company.name} has requested a review of your consultant payroll information. Sign in and choose this workspace to see the current requirements.\n\n#{links.join("\n\n")}\n\nSubmitting details does not approve them or initiate a payment.",
      content_type: "text/plain")
  end
end

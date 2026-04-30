# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("spec/mailers/previews/invoice_mailer_preview")
require Rails.root.join("spec/mailers/previews/monthly_reports_mailer_preview")
require Rails.root.join("spec/mailers/previews/send_payment_reminder_preview")
require Rails.root.join("spec/mailers/previews/user_invitation_preview")

RSpec.describe "Responsive mailer previews", type: :system, js: true do
  it "renders representative mailer previews without horizontal overflow on mobile" do
    previews = [
      InvoiceMailerPreview.new.send_invoice,
      SendPaymentReminderPreview.new.send_payment_reminder,
      UserInvitationPreview.new.send_user_invitation,
      MonthlyReportsMailerPreview.new.cash_flow_digest
    ]

    page.current_window.resize_to(390, 844)
    visit "/400.html"

    previews.each do |mail|
      html = mail.html_part&.body&.decoded || mail.body.decoded

      page.execute_script(<<~JS, html)
        const html = arguments[0];
        const parsed = new DOMParser().parseFromString(html, "text/html");
        document.head.innerHTML = parsed.head.innerHTML;
        document.body.innerHTML = parsed.body.innerHTML;
      JS

      expect(page).to have_css(".email-title", wait: 10)
      expect(page.evaluate_script("document.body.scrollWidth")).to eq(390)
      expect(page.evaluate_script("document.documentElement.scrollWidth")).to eq(390)
    end
  end
end

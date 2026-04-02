# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("spec/mailers/previews/client_payment_mailer_preview")
require Rails.root.join("spec/mailers/previews/payment_mailer_preview")
require Rails.root.join("spec/mailers/previews/invoice_mailer_preview")
require Rails.root.join("spec/mailers/previews/monthly_reports_mailer_preview")
require Rails.root.join("spec/mailers/previews/send_weekly_reminder_to_user_mailer_preview")
require Rails.root.join("spec/mailers/previews/user_invitation_preview")

RSpec.describe "Mailer previews", type: :mailer do
  it "renders the payment-related previews with html content" do
    client_payment_mail = ClientPaymentMailerPreview.new.payment
    payment_mail = PaymentMailerPreview.new.payment
    invoice_mail = InvoiceMailerPreview.new.invoice

    expect(client_payment_mail.subject).to include("Payment Receipt")
    expect(client_payment_mail.body.encoded).to include("Payment receipt")

    expect(payment_mail.subject).to include("Payment details")
    expect(payment_mail.body.encoded).to include("Payment confirmation")

    expect(invoice_mail.subject).to include("Invoice PREVIEW-001")
    expect(invoice_mail.body.encoded).to include("Your invoice is ready")
  end

  it "includes the shared responsive mailer hooks" do
    invoice_mail = InvoiceMailerPreview.new.invoice

    expect(invoice_mail.body.encoded).to include("@media only screen and (max-width: 640px)")
    expect(invoice_mail.body.encoded).to include("email-button-wrap")
    expect(invoice_mail.body.encoded).to include("detail-cell")
  end

  it "renders the shared preview support mailers with html content" do
    weekly_reminder_mail = SendWeeklyReminderToUserMailerPreview.new.notify_user_about_missed_entries
    invitation_mail = UserInvitationPreview.new.send_user_invitation
    monthly_digest_mail = MonthlyReportsMailerPreview.new.cash_flow_digest

    expect(weekly_reminder_mail.subject).to eq("Complete your Miru timesheet for last week")
    expect(weekly_reminder_mail.body.encoded).to include("Complete your timesheet")

    expect(invitation_mail.subject).to eq("You're invited to join Miru")
    expect(invitation_mail.body.encoded).to include("Join Miru")

    expect(monthly_digest_mail.subject).to include("cash flow digest")
    expect(monthly_digest_mail.body.encoded).to include("Top money-in sources")
  end
end

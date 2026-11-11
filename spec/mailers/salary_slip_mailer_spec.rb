# frozen_string_literal: true

require "rails_helper"

RSpec.describe SalarySlipMailer do
  it "renders a workspace/month private sign-in link in both formats without a PDF or amounts" do
    company = Company.new(id: 123, name: "Synthetic Studio")
    slip = SalarySlip.new(pay_month: "2026-09-01")
    allow(slip).to receive(:company).and_return(company)
    mail = described_class.with(slip:, recipient: "employee@example.test").published
    expect(mail.to).to eq(["employee@example.test"])
    expect(mail.subject).to include("2026-09")
    [mail.html_part, mail.text_part].each do |part|
      expect(part.body.decoded).to include("/salary-slips?company_id=123", "month=2026-09", "Sign in")
      expect(part.body.decoded).not_to include("active_storage", "salary amount")
    end
    expect(mail.attachments.none? { |attachment| attachment.mime_type == "application/pdf" }).to be(true)
  end

  it "renders fallback branding for a missing logo object without removing its metadata" do
    company = create(:company, :with_logo)
    blob = company.logo.blob
    blob.service.delete(blob.key)
    expect(blob.service.exist?(blob.key)).to be(false)
    slip = SalarySlip.new(pay_month: "2026-09-01")
    allow(slip).to receive(:company).and_return(company)
    mail = described_class.with(slip:, recipient: "employee@example.test").published

    body = mail.html_part.body.decoded

    expect(body).to include("email-brand-logo logo-light-mode", "/salary-slips?company_id=#{company.id}")
    expect(body).not_to include('class="email-company-logo"')
    expect(mail.attachments["MiruLogoDarkWithText.png"]).to be_present
    expect(mail.attachments.none? { |attachment| attachment.mime_type == "application/pdf" }).to be(true)
    expect(company.reload.logo).to be_attached
    expect(company.logo.blob.id).to eq(blob.id)
    expect(ActiveStorage::Blob.exists?(blob.id)).to be(true)
  end
end

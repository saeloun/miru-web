# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollProfileCompletionMailer do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace: company) }
  let(:accounts) { create(:user, current_workspace: company) }
  let(:worker) { create(:user, current_workspace: company) }
  let(:exit_date) { nil }
  let(:employment) { create(:employment, company:, user: worker, joined_at: "2020-01-01", resigned_at: exit_date) }

  before do
    enable_synthetic_payroll(company.id)
    [[owner, :owner], [accounts, :book_keeper], [worker, :employee]].each do |user, role|
      user.add_role(role, company)
      create(:employment, company:, user:, joined_at: "2020-01-01", resigned_at: nil) unless user == worker
    end
    EmployeeRecord.create!(employment:, private_details: { "bank_account_name" => "PRIVATE HOLDER", "bank_name" => "PRIVATE BANK",
      "bank_account_number" => "123456789012", "bank_ifsc" => "SYNT0000001" })
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2020-01-01", monthly_fee: "73124.59",
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: "Synthetic Entity", change_reason: "Configured")
    review_synthetic_billing_identity(employment:, reviewer: owner)
    submission = ConsultantBillingSubmission.heads.find_by!(employment:)
    review = ConsultantBillingReview.heads.find_by!(submission:)
    Payroll::BillingIdentity.new(employment, actor: owner).review!(submission_id: submission.id.to_s,
      expected_review_id: review.id.to_s, decision: "needs_information", reason: "Please correct the supporting evidence",
      manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: SecureRandom.uuid)
  end

  def requested_mail
    run = PayrollRun.create!(company:, period: (exit_date || Date.current).beginning_of_month, currency: "INR",
      accounts_reviewer: accounts, final_reviewer: owner)
    service = Payroll::ProfileCompletion.new(run, actor: accounts)
    source = service.summary(employment)
    request = service.create!(employment_id: employment.id.to_s, expected_digest: source.fetch(:source_digest), idempotency_key: SecureRandom.uuid)
    described_class.requested(request.id).message
  end

  it "renders a private plaintext request to the consultant with exact workspace-scoped self-service links" do
    message = requested_mail
    expect(message.to).to eq([worker.email])
    expect(message.cc).to be_nil
    expect(message.bcc).to be_nil
    expect(message.mime_type).to eq("text/plain")
    expect(message.subject).to eq("Review your consultant payroll details")
    body = message.body.decoded
    links = body.scan(%r{https?://\S+}).map { |url| URI.parse(url) }
    expect(links.map(&:host).uniq).to eq([URI.parse(described_class.new.send(:root_url)).host])
    expect(links.map { |uri| [uri.path, URI.decode_www_form(uri.query).to_h] }).to eq([
      ["/settings/employee-records", { "company_id" => company.id.to_s }],
      ["/settings/billing-identity", { "company_id" => company.id.to_s }]
    ])
    expect(body).to include("Submitting details does not approve them or initiate a payment")
    expect(body).not_to include("PRIVATE HOLDER", "PRIVATE BANK", "123456789012", "SYNT0000001", "73124.59",
      "AAAPC1234D", "1 Synthetic Road", "authorize", "invoice", worker.full_name)
  end

  context "after the consultant exits" do
    let(:exit_date) { Date.current - 1 }

    it "retains the billing correction link without directing them to inaccessible bank self-service" do
      body = requested_mail.body.decoded
      expect(body).to include("/settings/billing-identity?company_id=#{company.id}")
      expect(body).not_to include("/settings/employee-records", "bank details", "SWIFT")
    end
  end
end

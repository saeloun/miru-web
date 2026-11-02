# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuthResponsePayload do
  let(:payload_builder) { Class.new { include AuthResponsePayload }.new }
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }

  before do
    create(:employment, company:, user:, joined_at: nil, resigned_at: nil)
    user.add_role(:employee, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
  end

  it "derives records independently of payroll in every authenticated payload" do
    {
      signed_in_payload: { notice: "Signed in" },
      desktop_signed_in_payload: { google_oauth_success: false },
      mobile_signed_in_payload: {}, authenticated_user_payload: {}
    }.each do |method, options|
      payload = payload_builder.send(method, user, company:, **options)
      expect(payload.fetch(:company).slice("employee_records_available", "payroll_review_enabled"))
        .to eq("employee_records_available" => true, "payroll_review_enabled" => false)
      expect(payload.fetch(:user)).not_to include("encrypted_password", "otp_secret")
    end
  end

  it "uses the supplied identity and denies a stale captured company even with roles in both" do
    other = create(:company)
    create(:employment, company: other, user:, joined_at: nil, resigned_at: nil)
    user.add_role(:admin, other)
    expect(payload_builder.send(:company_payload, other, user:)).to include("employee_records_available" => false)
    expect(payload_builder.send(:company_payload, nil, user:)).to be_nil
    user.update!(current_workspace: other)
    expect(payload_builder.send(:company_payload, company, user:)).to include("employee_records_available" => false)
    expect(payload_builder.send(:company_payload, other, user:)).to include("employee_records_available" => true)
  end
end

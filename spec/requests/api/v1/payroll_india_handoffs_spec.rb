# frozen_string_literal: true

require "rails_helper"

RSpec.describe "India payroll accounts handoff API", type: :request do
  include_context "approved mercury consultant payroll"

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  let!(:india_terms) do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India Ltd",
      change_reason: "India accounts handoff")
  end
  let!(:revision) { approve_revision }
  let(:path) { "/api/v1/payroll_runs/#{run.id}/india_handoffs" }
  let(:mailbox) { "accounts@example.test" }

  def queue_handoff(expected_bank_digest: synthetic_india_bank_digest)
    post path, params: { company_id: company.id, employment_id: employment.id, expected_digest: revision.digest,
                        accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: }, as: :json
  end

  def handoff_action(id, action, attributes = {})
    post "#{path}/#{id}/#{action}", params: { company_id: company.id, india_handoff: attributes }, as: :json
  end

  it "privately reviews India funding without contacting any provider" do
    sign_in owner
    get path, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(json_response.dig("india_handoffs", "consultants", 0, "employment_id")).to eq(employment.id.to_s)
    expect(response.body).not_to include(bank_details.fetch("bank_account_number"), token)
    expect(a_request(:any, /mercury|razorpay/)).not_to have_been_made
  end

  it "queues once and never exposes the full bank account or reference in review history" do
    sign_in owner
    queue_handoff
    expect(response).to have_http_status(:created)
    handoff = PayrollIndiaHandoff.sole
    queue_handoff
    expect(response).to have_http_status(:created)
    expect(PayrollIndiaHandoff.count).to eq(1)
    expect(handoff.payroll_india_deliveries.count).to eq(1)
    expect(response.body).not_to include(bank_details.fetch("bank_account_number"))
    expect(json_response.dig("india_handoffs", "consultants", 0, "handoffs", 0, "accounts_email")).to eq(mailbox)
  end

  it "binds bank confirmation to the masked preview instead of accepting an unseen changed profile" do
    sign_in owner
    get path, as: :json
    shown_version = json_response.dig("india_handoffs", "consultants", 0, "preview", "bank_version")
    expect(shown_version).to match(/\A[0-9a-f]{64}\z/)
    employment.employee_record.update!(private_details: bank_details.merge("bank_account_number" => "999999998888"))
    queue_handoff(expected_bank_digest: shown_version)
    expect(response).to have_http_status(:conflict)
    expect(PayrollIndiaHandoff.count).to eq(0)
    queue_handoff(expected_bank_digest: nil)
    expect(response).to have_http_status(:conflict)
    get path, as: :json
    refreshed = json_response.dig("india_handoffs", "consultants", 0, "preview", "bank_version")
    expect(refreshed).not_to eq(shown_version)
    queue_handoff(expected_bank_digest: refreshed)
    expect(response).to have_http_status(:created)
    expect(PayrollIndiaHandoff.sole.report.dig("bank_details", "bank_account_number")).to eq("999999998888")
  end

  it "requires the explicitly bound current workspace on every write" do
    sign_in owner
    [nil, create(:company).id].each do |workspace|
      post path, params: { company_id: workspace, employment_id: employment.id, expected_digest: revision.digest,
                          accounts_email: mailbox, bank_confirmed: true }, as: :json
      expect(response).to have_http_status(:conflict)
    end
    expect(PayrollIndiaHandoff.count).to eq(0)
  end

  it "lets assigned accounts read and record credits but reserves dispatch for an owner" do
    sign_in accounts
    get path, as: :json
    expect(response).to have_http_status(:ok)
    expect(json_response.dig("india_handoffs", "permissions")).to include("manage" => false, "record_credit" => true)
    queue_handoff
    expect(response).to have_http_status(:forbidden)
    sign_in owner
    queue_handoff
    handoff = PayrollIndiaHandoff.sole
    handoff.payroll_india_deliveries.sole.update!(state: "sent", sent_at: Time.current)
    handoff_action(handoff.id, "record_credit", amount: "100", credited_on: Date.current.iso8601, reference: "SYNTHETIC-INR-001")
    expect(response).to have_http_status(:forbidden)
    sign_in accounts
    2.times do
      handoff_action(handoff.id, "record_credit", amount: "100", credited_on: Date.current.iso8601, reference: "SYNTHETIC-INR-001")
      expect(response).to have_http_status(:ok), response.parsed_body.slice("errors", "codes").inspect
    end
    expect(handoff.payroll_india_credits.count).to eq(1)
    expect(json_response.dig("india_handoffs", "consultants", 0, "handoffs", 0, "status")).to eq("partially_credited")
    expect(response.body).not_to include("SYNTHETIC-INR-001", bank_details.fetch("bank_account_number"))
    handoff_action(handoff.id, "record_credit", amount: "101", credited_on: Date.current.iso8601, reference: "SYNTHETIC-INR-001")
    expect(response).to have_http_status(:conflict)
  end

  it "denies unassigned accounts and employees without leaking the payroll" do
    %w[employee book_keeper admin].each do |role|
      user = create(:user, current_workspace: company)
      create(:employment, company:, user:, resigned_at: nil)
      user.add_role(role, company)
      sign_in user
      get path, as: :json
      expect(response).to have_http_status(:forbidden)
      queue_handoff
      expect(response).to have_http_status(:forbidden)
    end
  end

  it "rejects malformed financial input rather than raising a server error" do
    sign_in owner
    [[], {}, true].each do |id|
      post path, params: { company_id: company.id, employment_id: id, expected_digest: revision.digest,
                          accounts_email: mailbox, bank_confirmed: true }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
    queue_handoff
    handoff = PayrollIndiaHandoff.sole
    sign_in accounts
    post "#{path}/#{handoff.id}/record_credit", params: { company_id: company.id, india_handoff: ["invalid"] }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(handoff.payroll_india_credits.count).to eq(0)
  end

  it "does not resolve a run through another company's current workspace" do
    other = create(:company)
    enable_synthetic_payroll(other.id)
    intruder = create(:user, current_workspace: other)
    create(:employment, company: other, user: intruder, resigned_at: nil)
    intruder.add_role(:owner, other)
    sign_in intruder
    get path, as: :json
    expect(response).to have_http_status(:not_found)
    post path, params: { company_id: other.id, employment_id: employment.id }, as: :json
    expect(response).to have_http_status(:not_found)
  end
end

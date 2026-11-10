# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mercury payroll API", type: :request do
  include_context "reviewed mercury consultant payroll"

  let!(:revision) { approve_revision }
  let(:outsider_company) { create(:company) }

  def payments_path
    "/api/v1/payroll_runs/#{run.id}/mercury_payments"
  end

  def leg_path(leg, action)
    "#{payments_path}/#{leg.id}/#{action}"
  end

  def data
    json_response.fetch("mercury_payments")
  end

  describe "split bank input" do
    [{ "name" => "branch" }, ["branch"]].each do |branch|
      it "rejects a structured optional bank branch #{branch.class}" do
        sign_in owner
        payload = bank_details.merge("employment_id" => employment.id, "allocation_kind" => "percentage",
          "allocation_value" => "25", "allocated_to" => "spouse", "remainder_to" => "consultant",
          "account_number_confirmation" => bank_details.fetch("bank_account_number"), "bank_branch" => branch)

        post "/api/v1/payroll_runs/#{run.id}/split_arrangements",
          params: { company_id: company.id, payroll_split_arrangement: payload }, as: :json

        expect(response).to have_http_status(422)
        expect(PayrollSplitArrangement.where(employment:)).to be_empty
      end
    end
  end

  describe "reading" do
    before { sign_in owner }

    it "never calls the provider on a page read" do
      prepared_instruction(revision:)
      WebMock.reset_executed_requests!
      get payments_path, as: :json
      expect(response).to have_http_status(200)
      expect(a_request(:any, /mercury/)).not_to have_been_made
    end

    it "does not return the token, key or full bank numbers" do
      prepared_instruction(revision:)
      get payments_path, as: :json
      expect(response.headers["Cache-Control"]).to include("private", "no-store")
      expect(response.body).not_to include(token, "secret-token", "123456789012", "9876543210", account_id, PayrollPaymentInstruction.last.idempotency_key)
      expect(data.dig("consultants", 0, "legs", 0, "recipient", "account_mask")).to eq("9012")
    end

    it "shows the owner principal, fee, debit, rate, purpose and an off switch" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return(nil)
      prepared_instruction(revision:)
      get payments_path, as: :json
      leg = data.dig("consultants", 0, "legs", 0)
      expect(leg.values_at("principal_minor", "fee_minor", "company_debit_minor", "charge_type")).to eq(%w[74405 1500 75905 ours])
      expect(leg.values_at("reference_rate", "buffered_rate", "rate_source")).to eq(["85.5", "84.0", "Synthetic reference"])
      expect(leg["purpose_info"]).to eq("Synthetic Consultant")
      expect(data.dig("setup", "writes_enabled")).to be(false)
      expect(data.dig("setup", "verified")).to be(true)
    end

    it "reports not-configured setup accurately" do
      get payments_path, as: :json
      expect(data["setup"]).to include("configured" => false, "verified" => false, "writes_enabled" => false)
      expect(data.dig("consultants", 0, "blockers")).to include("connection_missing")
    end
  end

  describe "authorization" do
    it "denies a role-less employee, an unassigned bookkeeper and a global super admin without a company role" do
      employee = create(:user, current_workspace: company)
      create(:employment, company:, user: employee, resigned_at: nil)
      employee.add_role(:employee, company)
      bookkeeper = create(:user, current_workspace: company)
      create(:employment, company:, user: bookkeeper, resigned_at: nil)
      bookkeeper.add_role(:book_keeper, company)
      [employee, bookkeeper].each do |user|
        sign_in user
        get payments_path, as: :json
        expect(response).to have_http_status(403)
        post payments_path, params: { company_id: company.id, employment_id: employment.id }, as: :json
        expect(response).to have_http_status(403)
      end
    end

    it "lets the assigned accounts reviewer read but not prepare or submit" do
      prepared = prepared_instruction(revision:)
      sign_in accounts
      get payments_path, as: :json
      expect(response).to have_http_status(200)
      expect(data["permissions"]).to include("manage" => false, "accounts_review" => true)
      post payments_path, params: { company_id: company.id, employment_id: employment.id }, as: :json
      expect(response).to have_http_status(403)
      post leg_path(prepared, "submit"), params: { company_id: company.id, expected_digest: prepared.frozen_digest }, as: :json
      expect(response).to have_http_status(403)
    end

    it "does not let an admin create a request" do
      prepared = prepared_instruction(revision:)
      admin = create(:user, current_workspace: company)
      create(:employment, company:, user: admin, resigned_at: nil)
      admin.add_role(:admin, company)
      sign_in admin
      post leg_path(prepared, "submit"), params: { company_id: company.id, expected_digest: prepared.frozen_digest }, as: :json
      expect(response).to have_http_status(403)
    end

    it "hides another company's run and instruction" do
      prepared = prepared_instruction(revision:)
      other_owner = create(:user, current_workspace: outsider_company)
      create(:employment, company: outsider_company, user: other_owner, resigned_at: nil)
      other_owner.add_role(:owner, outsider_company)
      enable_synthetic_payroll(outsider_company.id)
      sign_in other_owner
      get payments_path, as: :json
      expect(response).to have_http_status(404)
      post leg_path(prepared, "submit"), params: { company_id: outsider_company.id, expected_digest: prepared.frozen_digest }, as: :json
      expect(response).to have_http_status(404)
      expect(a_request(:post, /request-send-money/)).not_to have_been_made
    end

    it "rejects a stale workspace on writes" do
      prepared = prepared_instruction(revision:)
      sign_in owner
      post leg_path(prepared, "submit"), params: { company_id: outsider_company.id, expected_digest: prepared.frozen_digest }, as: :json
      expect(response).to have_http_status(409)
      post leg_path(prepared, "submit"), params: { expected_digest: prepared.frozen_digest }, as: :json
      expect(response).to have_http_status(409)
    end

    it "is unavailable without the entitlement" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return(nil)
      sign_in owner
      get payments_path, as: :json
      expect(response).to have_http_status(403)
    end
  end

  describe "setup" do
    before { sign_in owner }

    def save_connection(params = {})
      patch "/api/v1/payroll_mercury_connection", params: {
        company_id: company.id,
        payroll_mercury_connection: { api_token: token, environment: "sandbox", source_account_id: account_id,
                                      expected_legal_business_name: legal_name }.merge(params)
      }, as: :json
    end

    it "never returns the token and stores it encrypted" do
      save_connection
      expect(response).to have_http_status(200)
      expect(response.body).not_to include(token)
      raw = PayrollMercuryConnection.connection.select_value("SELECT api_token FROM payroll_mercury_connections WHERE company_id = #{company.id}")
      expect(raw).not_to include("mercury_sandbox_synthetic")
      connection = PayrollMercuryConnection.find_by!(company:)
      expect(connection.inspect).not_to include("mercury_sandbox_synthetic")
      expect(connection.to_json).not_to include("mercury_sandbox_synthetic")
      expect(Audited::Audit.where(auditable: connection).to_json).not_to include("mercury_sandbox_synthetic")
    end

    it "keeps a saved token when the field is left blank" do
      save_connection
      save_connection(api_token: "")
      expect(PayrollMercuryConnection.find_by!(company:).api_token).to eq(token)
    end

    it "verifies read access only and does not claim payment capability" do
      save_connection
      stub_mercury_reads
      post "/api/v1/payroll_mercury_connection/verify", params: { company_id: company.id }, as: :json
      expect(response).to have_http_status(200)
      expect(a_request(:post, /request-send-money/)).not_to have_been_made
    end

    it "clears verification when the account no longer matches" do
      save_connection
      stub_mercury_reads
      post "/api/v1/payroll_mercury_connection/verify", params: { company_id: company.id }, as: :json
      stub_mercury_reads(account: mercury_account("legalBusinessName" => "Other LLC"))
      post "/api/v1/payroll_mercury_connection/verify", params: { company_id: company.id }, as: :json
      expect(response).to have_http_status(422)
      expect(json_response["codes"]).to eq(["source_account_ineligible"])
      expect(PayrollMercuryConnection.find_by!(company:).read_verified?).to be(false)
    end

    it "does not treat a filled SWIFT without a Mercury recipient as linked" do
      save_connection
      stub_mercury_reads
      post "/api/v1/payroll_mercury_connection/verify", params: { company_id: company.id }, as: :json
      get payments_path, as: :json
      expect(data.dig("consultants", 0, "blockers")).to include("recipient_not_linked")
    end

    it "rejects arbitrary beneficiary labels before reading or saving a recipient" do
      verified_connection
      post "/api/v1/payroll_mercury_connection/recipients",
        params: { company_id: company.id, employment_id: employment.id, recipient_id:, beneficiary: "other" }, as: :json

      expect(response).to have_http_status(422)
      expect(json_response["codes"]).to eq(["beneficiary_invalid"])
      expect(PayrollMercuryRecipientLink.count).to eq(0)
      expect(a_request(:get, "#{mercury_base}/recipient/#{recipient_id}")).not_to have_been_made
    end

    {
      "swiftCode" => "recipient_swift_mismatch", "iban" => "recipient_account_mismatch"
    }.each do |field, code|
      it "refuses a recipient whose #{field} differs from the profile" do
        verified_connection
        recipient = mercury_recipient
        recipient["internationalWireRoutingInfo"][field] = "OTHRINBBXXX"
        stub_mercury_reads(recipient:)
        post "/api/v1/payroll_mercury_connection/recipients",
          params: { company_id: company.id, employment_id: employment.id, recipient_id: }, as: :json
        expect(response).to have_http_status(422)
        expect(json_response["codes"]).to include(code)
        expect(PayrollMercuryRecipientLink.count).to eq(0)
      end
    end

    it "refuses a recipient with no international wire details" do
      verified_connection
      stub_mercury_reads(recipient: mercury_recipient("internationalWireRoutingInfo" => nil))
      post "/api/v1/payroll_mercury_connection/recipients",
        params: { company_id: company.id, employment_id: employment.id, recipient_id: }, as: :json
      expect(json_response["codes"]).to eq(["recipient_not_international_wire"])
    end

    it "cannot link another company's employment" do
      verified_connection
      foreign = create(:employment, company: outsider_company, resigned_at: nil)
      post "/api/v1/payroll_mercury_connection/recipients",
        params: { company_id: company.id, employment_id: foreign.id, recipient_id: }, as: :json
      expect(response).to have_http_status(404)
    end

    it "does not let an admin change the connection" do
      admin = create(:user, current_workspace: company)
      create(:employment, company:, user: admin, resigned_at: nil)
      admin.add_role(:admin, company)
      sign_in admin
      save_connection
      expect(response).to have_http_status(403)
    end
  end

  describe "the workflow" do
    before { sign_in owner }

    it "prepares and submits from the API, then shows blocked actions with codes" do
      verified_connection
      linked_recipient
      post payments_path, params: { company_id: company.id, employment_id: employment.id, expected_digest: revision.digest, mode: "manual",
                                    reference_rate: "85.50", source: "Synthetic", observed_at: 1.hour.ago.iso8601 }, as: :json
      expect(response).to have_http_status(201)
      leg = data.dig("consultants", 0, "legs", 0)
      expect(leg["display_state"]).to eq("ready_for_submission")
      expect(leg.dig("actions", "submit")).to be(true)
      stub_mercury_write
      post "#{payments_path}/#{leg['id']}/submit", params: { company_id: company.id, expected_digest: leg["frozen_digest"] }, as: :json
      expect(response).to have_http_status(200)
      expect(data.dig("consultants", 0, "legs", 0, "display_state")).to eq("awaiting_mercury_approval")
      post "#{payments_path}/#{leg['id']}/submit", params: { company_id: company.id, expected_digest: leg["frozen_digest"] }, as: :json
      expect(response).to have_http_status(422)
      expect(json_response["codes"]).to include("already_submitted")
      expect(a_request(:post, /request-send-money/)).to have_been_made.once
    end

    it "does not offer the attestation path to the owner and offers it to accounts" do
      prepared = prepared_instruction(revision:)
      stub_mercury_reads
      stub_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money").to_timeout
      post leg_path(prepared, "submit"), params: { company_id: company.id, expected_digest: prepared.frozen_digest }, as: :json
      leg = data.dig("consultants", 0, "legs", 0)
      expect(leg["display_state"]).to eq("submission_uncertain")
      expect(leg.dig("actions", "submit")).to be(false)
      expect(leg.dig("actions", "void")).to be(false)
      expect(leg.dig("actions", "attest_absence")).to be(false)
      sign_in accounts
      get payments_path, as: :json
      expect(data.dig("consultants", 0, "legs", 0, "actions", "attest_absence")).to be(true)
    end
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved hiring offers", type: :request do
  include_context "interview message records"
  before { sign_in admin }

  def offers_path = "/api/v1/hiring/applications/#{application.id}/offers"

  def select_candidate
    service = Hiring::Decisions.new(application:, actor: admin)
    record, = service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "pass", "reason" => "PRIVATE SELECTION REASON", "owner_employment_id" => nil, "follow_up_on" => nil })
    service.finalize!(decision: record, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "decision_version" => record.lock_version })
  end

  def offer_attributes(**changes)
    { company_id: company.id, application_version: application.reload.lock_version, request_key: SecureRandom.uuid,
      engagement: "consultant", title: "Software consultant", amount: "125000.50", currency: "INR", period: "monthly",
      joining_on: "2026-11-20", expires_on: "2026-11-10" }.merge(changes)
  end

  def prepare_offer(attributes = offer_attributes)
    post offers_path, params: { hiring_offer: attributes }, as: :json
    expect(response).to have_http_status(:created), response.body
    company.hiring_offers.find(response.parsed_body.dig("offer", "id"))
  end

  def current_versions(record)
    { company_id: company.id, application_version: application.reload.lock_version, offer_version: record.reload.lock_version }
  end

  def issue_offer(record, attributes = current_versions(record))
    post "#{offers_path}/#{record.id}/issue", params: { hiring_offer: attributes }, as: :json
  end

  def issued_offer
    select_candidate
    record = prepare_offer
    issue_offer(record)
    expect(response).to have_http_status(:ok), response.body
    record.reload
  end

  def portal_open(record)
    post "/hiring-offer/open", params: { offer_portal: { token: record.access_token } }, as: :json
  end

  it "records private preparing terms for a selected candidate without creating profiles or sending anything" do
    select_candidate
    expect { prepare_offer }.not_to change(User, :count)
    record = company.hiring_offers.sole
    expect(record.state).to eq("preparing")
    expect(record.details).to include("engagement" => "consultant", "amount" => "125000.50")
    expect(record.read_attribute_before_type_cast("details")).not_to include("125000.50")
    expect(response.parsed_body.fetch("offer")).not_to have_key("private_url")
    expect(application.reload.stage).to eq("final_decision")
    expect(HiringMessage.count).to eq(0)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "recovers exact preparing intent and rejects conflicting reuse or a second active offer" do
    select_candidate
    input = offer_attributes
    record = prepare_offer(input)
    post offers_path, params: { hiring_offer: input }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("offer", "id")).to eq(record.id)
    post offers_path, params: { hiring_offer: input.merge(amount: "900.00") }, as: :json
    expect(response).to have_http_status(:conflict)
    post offers_path, params: { hiring_offer: offer_attributes }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(company.hiring_offers.count).to eq(1)
  end

  it "refuses offers before an explicit final selection and denies staff or foreign workspaces" do
    post offers_path, params: { hiring_offer: offer_attributes }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    sign_in interviewer
    post offers_path, params: { hiring_offer: offer_attributes }, as: :json
    expect(response).to have_http_status(:forbidden)
    sign_in admin
    get offers_path, params: { company_id: create(:company).id }
    expect(response).to have_http_status(:conflict)
  end

  it "edits preparing terms with exact retry recovery but refuses stale overwrites" do
    select_candidate
    record = prepare_offer
    input = offer_attributes.except(:request_key).merge(current_versions(record), amount: "135000.75")
    2.times do
      patch "#{offers_path}/#{record.id}", params: { hiring_offer: input }, as: :json
      expect(response).to have_http_status(:ok)
    end
    patch "#{offers_path}/#{record.id}", params: { hiring_offer: input.merge(amount: "140000.00") }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(record.reload.details.fetch("amount")).to eq("135000.75")
  end

  it "validates engagement, supported currency/minor units, monthly/annual period and strict dates" do
    select_candidate
    [{ amount: 125000.50 }, { amount: "0" }, { amount: "-1" }, { amount: "1e3" }, { amount: "1.001" },
      { currency: "XXX" }, { currency: "inr" }, { currency: "JPY", amount: "1.50" }, { period: "weekly" },
      { engagement: "owner" }, { title: "" }, { title: "Hidden\nheader" }, { joining_on: "2026-02-30" }, { expires_on: "9999-11-10" }].each do |invalid|
      post offers_path, params: { hiring_offer: offer_attributes(**invalid) }, as: :json
      expect(response).to have_http_status(:unprocessable_entity), invalid.inspect
    end
    expect(company.hiring_offers.count).to eq(0)
    record = prepare_offer(offer_attributes(engagement: "employee", currency: "USD", period: "annual"))
    expect(record.details).to include("engagement" => "employee", "currency" => "USD", "period" => "annual")
  end

  it "issues immutable approved terms and a private fragment link once without claiming email delivery" do
    select_candidate
    record = prepare_offer
    input = current_versions(record)
    2.times do
      issue_offer(record, input)
      expect(response).to have_http_status(:ok), response.body
      expect(response.parsed_body.dig("offer", "private_path")).to match(%r{\A/hiring-offer#[1-9A-HJ-NP-Za-km-z]{32}\z})
    end
    expect(record.reload.state).to eq("sent")
    expect(record.issue_details).to include("recipient" => "candidate@example.test", "candidate_name" => candidate_name)
    expect(application.reload.stage).to eq("offer")
    expect(HiringMessage.count).to eq(0)
    expect { record.update!(details: record.details.merge("amount" => "1.00")) }.to raise_error(ActiveRecord::RecordInvalid)
    patch "#{offers_path}/#{record.id}", params: { hiring_offer: offer_attributes.except(:request_key).merge(current_versions(record)) }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "refuses stale issuance, past terms and a newer unfinalized decision" do
    select_candidate
    record = prepare_offer
    old = current_versions(record)
    application.touch
    issue_offer(record, old)
    expect(response).to have_http_status(:conflict)
    record.update!(details: record.details.merge("expires_on" => "2026-11-02"))
    issue_offer(record)
    expect(response).to have_http_status(:unprocessable_entity)
    record.update!(details: record.details.merge("expires_on" => "2026-11-10"))
    Hiring::Decisions.new(application:, actor: admin).create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "hold", "reason" => "Pending review", "owner_employment_id" => nil, "follow_up_on" => nil })
    issue_offer(record)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(record.reload.state).to eq("preparing")
  end

  it "scopes saved offers and private links to current Admin authority and the route application" do
    select_candidate
    record = prepare_offer
    sign_in interviewer
    get offers_path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    issue_offer(record)
    expect(response).to have_http_status(:forbidden)
    sign_in admin
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Other Candidate", "email" => "other@example.test" }).process
    post "/api/v1/hiring/applications/#{other.id}/offers/#{record.id}/issue", params: { hiring_offer: current_versions(record) }, as: :json
    expect(response).to have_http_status(:not_found)
    admin.remove_role(:admin, company)
    issue_offer(record)
    expect(response).to have_http_status(:forbidden)
    expect(record.reload.state).to eq("preparing")
  end

  it "filters private offer terms and portal tokens out of request logging" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter("hiring_offer" => offer_attributes, "offer_portal" => { "token" => "PRIVATE", "outcome" => "accepted" }))
      .to eq("hiring_offer" => "[FILTERED]", "offer_portal" => "[FILTERED]")
  end

  it "exposes only the issued candidate terms and records acceptance once without onboarding side effects" do
    record = issued_offer
    sign_out admin
    portal_open(record)
    expect(response).to have_http_status(:ok), response.body
    data = response.parsed_body.fetch("offer")
    expect(data.keys).to match_array(%w[state lock_version company_name candidate_name recipient terms issued_at expires_at responded_at])
    expect(data.fetch("terms")).to eq(record.details)
    expect(response.body).not_to include("PRIVATE", "request_key", "intent", "access_token", "created_by")
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(response.headers["Referrer-Policy"]).to eq("no-referrer")
    input = { token: record.access_token, offer_version: data.fetch("lock_version"), outcome: "accepted" }
    counts = [User.count, Employment.count, EmployeeRecord.count, CompensationVersion.count, SignatureRequest.count, HiringMessage.count]
    2.times do
      post "/hiring-offer/reply", params: { offer_portal: input }, as: :json
      expect(response).to have_http_status(:ok), response.body
      expect(response.parsed_body.dig("offer", "state")).to eq("accepted")
    end
    expect([User.count, Employment.count, EmployeeRecord.count, CompensationVersion.count, SignatureRequest.count, HiringMessage.count]).to eq(counts)
    expect(application.reload.stage).to eq("offer")
    expect(record.reload.response_details).to eq(input.except(:token).stringify_keys)
    expect(record.responded_at).to be_present
    post "/hiring-offer/reply", params: { offer_portal: input.merge(outcome: "declined") }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(record.reload.state).to eq("accepted")
  end

  it "refuses stale or unknown candidate intent, then records decline without rewriting issued terms" do
    record = issued_offer
    frozen = record.details
    sign_out admin
    post "/hiring-offer/reply", params: { offer_portal: { token: record.access_token, offer_version: 0, outcome: "accepted" } }, as: :json
    expect(response).to have_http_status(:conflict)
    post "/hiring-offer/reply", params: { offer_portal: { token: record.access_token, offer_version: record.lock_version, outcome: "hired" } }, as: :json
    expect(response).to have_http_status(:bad_request)
    post "/hiring-offer/reply", params: { offer_portal: { token: record.access_token, offer_version: record.lock_version, outcome: "declined" } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(record.reload.state).to eq("declined")
    expect(record.details).to eq(frozen)
    expect { record.update!(state: "accepted") }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "enforces the saved local expiry even before the scheduled sweep and permits a replacement afterward" do
    record = issued_offer
    zone = record.details.fetch("time_zone")
    expect(record.expires_at.in_time_zone(zone).to_date.iso8601).to eq("2026-11-10")
    travel_to(record.expires_at + 1.second)
    sign_out admin
    portal_open(record)
    expect(response).to have_http_status(:gone)
    HiringOfferExpiryJob.perform_now
    expect(record.reload.state).to eq("expired")
    sign_in admin
    replacement = prepare_offer(offer_attributes(expires_on: "2026-11-15"))
    expect(replacement.id).not_to eq(record.id)
    expect(record.reload.details.fetch("expires_on")).to eq("2026-11-10")
  end

  it "revokes a private offer link with exact repeat safety and never exposes an unissued or random token" do
    record = issued_offer
    attributes = current_versions(record)
    2.times do
      post "#{offers_path}/#{record.id}/revoke", params: { hiring_offer: attributes }, as: :json
      expect(response).to have_http_status(:ok), response.body
      expect(response.parsed_body.fetch("offer")).not_to have_key("private_path")
    end
    sign_out admin
    portal_open(record)
    expect(response).to have_http_status(:gone)
    post "/hiring-offer/open", params: { offer_portal: { token: SecureRandom.base58(32) } }, as: :json
    expect(response).to have_http_status(:gone)
    expect(record.reload.state).to eq("expired")
  end

  it "blocks candidate access after source email or application changes" do
    record = issued_offer
    sign_out admin
    application.hiring_candidate.update!(email: "changed@example.test")
    portal_open(record)
    expect(response).to have_http_status(:gone)
    application.hiring_candidate.update!(email: "candidate@example.test")
    application.reload.update!(stage: "withdrawn")
    portal_open(record)
    expect(response).to have_http_status(:gone)
    expect(response.body).not_to include("125000.50", candidate_name)
    expect(record.reload.state).to eq("sent")
  end

  it "keeps issued company terms available if the issuer changes workspace or later leaves the Admin role" do
    record = issued_offer
    sign_out admin
    admin.update!(current_workspace: create(:company))
    portal_open(record)
    expect(response).to have_http_status(:ok)
    admin.remove_role(:admin, company)
    portal_open(record)
    expect(response).to have_http_status(:ok), response.body
    post "/hiring-offer/reply", params: { offer_portal: { token: record.access_token, offer_version: record.lock_version, outcome: "accepted" } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload.state).to eq("accepted")
  end

  it "requires CSRF and renders no offer data from a query token" do
    record = issued_offer
    sign_out admin
    with_forgery_protection do
      portal_open(record)
      expect(response).to have_http_status(:unprocessable_entity)
    end
    post "/hiring-offer/open", params: { offer_portal: { token: record.access_token, application_id: application.id } }, as: :json
    expect(response).to have_http_status(:bad_request)
    get "/hiring-offer", params: { token: record.access_token }
    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include(record.access_token, "125000.50", candidate_name)
  end

  it "allows a replacement immediately after expiry while the scheduled sweep is still pending" do
    record = issued_offer
    travel_to(record.expires_at + 1.second)
    replacement = prepare_offer(offer_attributes(expires_on: "2026-11-15"))
    expect(replacement.state).to eq("preparing")
    expect(record.reload.state).to eq("expired")
  end

  it "makes the issued private link unavailable when selection is reopened" do
    record = issued_offer
    Hiring::Decisions.new(application:, actor: admin).create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "hold", "reason" => "Selection under review", "owner_employment_id" => nil, "follow_up_on" => nil })
    sign_out admin
    portal_open(record)
    expect(response).to have_http_status(:gone)
    expect(record.reload.state).to eq("sent")
    expect(response.body).not_to include("125000.50", "Selection under review")
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reviewed service-period fees", type: :request do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  before { employment.update!(joined_at: Date.new(2026, 11, 16)) }

  let(:path) { "/api/v1/payroll_service_fees/#{employment.id}" }

  def context
    get path, params: { company_id: company.id, period: "2026-11" }
    expect(response).to have_http_status(200)
    response.parsed_body.fetch("service_period")
  end

  def command(facts)
    { period: "2026-11", amount: "50000.00", reason: "Agreed fee for the recorded service period",
      expected_digest: facts.fetch("digest"), expected_review_id: facts.dig("current_review", "id").to_s,
      idempotency_key: "synthetic-service-fee" }
  end

  it "serves private context without writes and records an explicit replay-safe fee" do
    sign_in owner
    facts = context
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(facts.fetch("required")).to be(true)
    expect(facts.fetch("context")).to include("service_from" => "2026-11-16", "service_to" => "2026-11-30")
    input = command(facts)
    post path, params: { company_id: company.id, service_fee_review: input }, as: :json
    expect(response).to have_http_status(201)
    saved = response.parsed_body.fetch("service_period").fetch("current_review")
    expect(saved).to include("reason" => input.fetch(:reason), "current" => true)
    expect(saved.fetch("amount")).to be_a(String)
    expect(saved.fetch("amount").to_d).to eq(50_000)
    expect do
      post path, params: { company_id: company.id, service_fee_review: input }, as: :json
      expect(response).to have_http_status(201)
      expect(response.parsed_body.dig("service_period", "current_review", "id")).to eq(saved.fetch("id"))
      context
    end.not_to change(ConsultantServiceFeeReview, :count)
  end

  it "preserves the source boundary and refuses forged or stale input" do
    sign_in owner
    input = command(context)
    post path, params: { company_id: company.id, service_fee_review: input.merge(actor_id: owner.id.to_s) }, as: :json
    expect(response).to have_http_status(422)
    post path, params: { company_id: company.id, service_fee_review: input.merge(amount: ["50000"]) }, as: :json
    expect(response).to have_http_status(422)
    employment.update!(resigned_at: Date.new(2026, 11, 27))
    post path, params: { company_id: company.id, service_fee_review: input }, as: :json
    expect(response).to have_http_status(409)
    expect(ConsultantServiceFeeReview.count).to eq(0)
  end

  it "requires the current workspace, rejects foreign records and denies ordinary staff" do
    sign_in owner
    input = command(context)
    post path, params: { service_fee_review: input }, as: :json
    expect(response).to have_http_status(409)
    post path, params: { company_id: company.id + 1, service_fee_review: input }, as: :json
    expect(response).to have_http_status(409)
    foreign = create(:employment)
    get "/api/v1/payroll_service_fees/#{foreign.id}", params: { company_id: company.id, period: "2026-11" }
    expect(response).to have_http_status(404)
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    sign_in worker
    get path, params: { company_id: company.id, period: "2026-11" }
    expect(response).to have_http_status(403)
    post path, params: { company_id: company.id, service_fee_review: input }, as: :json
    expect(response).to have_http_status(403)
  end

  it "allows assigned accounts while denying other book keepers" do
    run
    sign_in accounts
    input = command(context)
    post path, params: { company_id: company.id, service_fee_review: input }, as: :json
    expect(response).to have_http_status(201)
    other = create(:user, current_workspace: company)
    create(:employment, company:, user: other, joined_at: Date.new(2020, 1, 1), resigned_at: nil)
    other.add_role(:book_keeper, company)
    sign_in other
    get path, params: { company_id: company.id, period: "2026-11" }
    expect(response).to have_http_status(403)
  end

  it "protects a session-authenticated fee change from CSRF" do
    sign_in owner
    input = command(context)
    controller = Api::V1::PayrollServiceFeesController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    post path, params: { company_id: company.id, service_fee_review: input }, as: :json
    expect(response).to have_http_status(422)
    expect(ConsultantServiceFeeReview.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original if controller
  end
end

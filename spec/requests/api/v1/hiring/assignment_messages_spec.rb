# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved candidate assignment messages", type: :request do
  include_context "assignment message records"
  before { sign_in admin }

  def path = "/api/v1/hiring/applications/#{application.id}/assignments/#{assignment.id}/messages"

  def preview
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "assignment", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    response.parsed_body.fetch("preview")
  end

  it "requires approved assignment wording and exposes bounded private preview without queuing" do
    approve
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "assignment", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    approve_assignment_messages
    result = preview
    expect(result.fetch("body")).to include("Catalogue assessment", "/hiring-assignment#")
    expect(result.fetch("body")).not_to include("PRIVATE", interviewer.email)
    expect(result.fetch("intent").to_json).not_to include(assignment.access_token)
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(HiringMessage.count).to eq(0)
  end

  it "queues an immutable intent once and recovers its response after submission" do
    approve_assignment_messages
    intent = preview.fetch("intent")
    post path, params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:created), response.body
    identity = response.parsed_body.dig("message", "id")
    submit_assignment
    post path, params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("message", "id")).to eq(identity)
    expect(HiringMessage.count).to eq(1)
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("messages").sole).to include("retryable" => false)
  end

  it "records unknown evidence after expiry without queueing another attempt" do
    approve_assignment_messages
    post path, params: { hiring_message: preview.fetch("intent") }, as: :json
    record = HiringMessage.sole
    record.update!(state: "uncertain", error_code: "transport_unknown")
    travel_to(assignment.due_at + 1.second)
    post "#{path}/#{record.id}/reconcile", params: { hiring_message: { company_id: company.id, message_version: record.lock_version,
      outcome: "accepted", evidence: "Local SMTP captured accepted DATA", worker_stopped: false } }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("message", "resolution")).to eq("accepted")
    expect(HiringMessage.count).to eq(1)
  end

  it "rejects stale or forged intent and unapproved message fields" do
    approve_assignment_messages
    intent = preview.fetch("intent")
    assignment.touch
    post path, params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:conflict)
    post path, params: { hiring_message: preview.fetch("intent").merge("body" => "Injected") }, as: :json
    expect(response).to have_http_status(:bad_request)
    expect(HiringMessage.count).to eq(0)
  end

  it "denies another application, workspace, interviewer and removed Admin" do
    approve_assignment_messages
    target = path
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => "other@example.test" }).process
    get target.sub("/applications/#{application.id}/", "/applications/#{other.id}/"), params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    get target, params: { company_id: create(:company).id }
    expect(response).to have_http_status(:conflict)
    sign_out admin
    sign_in interviewer
    get target, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("Catalogue assessment", "PRIVATE")
    sign_out interviewer
    sign_in admin
    admin.remove_role(:admin, company)
    get target, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end
end

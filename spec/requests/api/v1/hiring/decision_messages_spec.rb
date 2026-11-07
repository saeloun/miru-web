# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved candidate rejection messages", type: :request do
  include_context "interview message records"
  before { sign_in admin }

  def finalized(outcome = "reject")
    service = Hiring::Decisions.new(application:, actor: admin)
    decision, = service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => outcome, "reason" => "PRIVATE FINAL DECISION", "owner_employment_id" => nil, "follow_up_on" => nil })
    service.finalize!(decision:, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "decision_version" => decision.lock_version })
  end

  def approve_rejection
    setting = approve
    configure = Hiring::Configure.new(company:, actor: admin)
    setting = configure.save_draft!(lock_version: setting.lock_version, details: setting.details.merge(
      "rejection_subject" => "Application update", "rejection_body" => "Thank you for meeting our team. We will not proceed with this application."))
    configure.approve!(lock_version: setting.lock_version)
  end

  def path(decision) = "/api/v1/hiring/applications/#{application.id}/decisions/#{decision.id}/messages"

  def preview(decision)
    post "#{path(decision)}/preview", params: { hiring_message: { company_id: company.id, kind: "rejection", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:ok)
    response.parsed_body.fetch("preview")
  end

  it "requires an approved template and previews a finalized rejection without queuing it" do
    decision = finalized
    post "#{path(decision)}/preview", params: { hiring_message: { company_id: company.id, kind: "rejection", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    approve_rejection
    message = preview(decision)
    expect(message.fetch("body")).not_to include("PRIVATE", "reason", "recommendation")
    expect(message.fetch("to")).to eq("candidate@example.test")
    expect(HiringMessage.count).to eq(0)
  end

  it "queues one frozen rejection on the otherwise closed application and recovers the original intent" do
    approve_rejection
    decision = finalized
    intent = preview(decision).fetch("intent")
    [201, 200].each do |status|
      post path(decision), params: { hiring_message: intent }, as: :json
      expect(response).to have_http_status(status)
    end
    message = HiringMessage.sole
    expect(message.kind).to eq("rejection")
    expect(message.event_key).to eq("decision:#{decision.id}")
    expect(message.content.fetch("body")).not_to include("PRIVATE")
    expect(application.reload.stage).to eq("rejected")
    application.touch
    post path(decision), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:ok)
    expect(HiringMessage.count).to eq(1)
  end

  it "prepares a read-only rejection draft before finalization without permitting a send" do
    approve_rejection
    record, = Hiring::Decisions.new(application:, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "request_key" => SecureRandom.uuid,
      "outcome" => "reject", "reason" => "PRIVATE UNFINALIZED REASON", "owner_employment_id" => nil, "follow_up_on" => nil })
    prepared = preview(record)
    expect(prepared.fetch("can_queue")).to be(false)
    expect(prepared.fetch("body")).not_to include("PRIVATE")
    post path(record), params: { hiring_message: prepared.fetch("intent") }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(application.reload.stage).to eq("received")
    expect(HiringMessage.count).to eq(0)
  end

  it "refuses draft or non-rejection decisions and foreign application routes" do
    approve_rejection
    decision = finalized("pass")
    post "#{path(decision)}/preview", params: { hiring_message: { company_id: company.id, kind: "rejection", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => "other-decision@example.test" }).process
    get "/api/v1/hiring/applications/#{other.id}/decisions/#{decision.id}/messages", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    expect(HiringMessage.count).to eq(0)
  end

  it "refuses an unapproved template without queuing the old preview" do
    setting = approve_rejection
    decision = finalized
    intent = preview(decision).fetch("intent")
    setting.update!(details: setting.details.merge("rejection_body" => "Changed unapproved body"))
    post path(decision), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(HiringMessage.count).to eq(0)
  end

  it "conflicts instead of silently switching a previously previewed recipient" do
    approve_rejection
    record = finalized
    intent = preview(record).fetch("intent")
    application.hiring_candidate.update!(email: "changed-recipient@example.test")
    post path(record), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(HiringMessage.count).to eq(0)
  end

  it "requires evidence and stopped-worker confirmation before a separate retry of an unknown send" do
    approve_rejection
    decision = finalized
    intent = preview(decision).fetch("intent")
    post path(decision), params: { hiring_message: intent }, as: :json
    message = HiringMessage.sole
    message.update!(state: "uncertain", error_code: "transport_unknown", started_at: Time.current)
    attributes = { company_id: company.id, message_version: message.lock_version, outcome: "not_accepted", evidence: "Synthetic SMTP non-acceptance", worker_stopped: false }
    post "#{path(decision)}/#{message.id}/reconcile", params: { hiring_message: attributes }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    post "#{path(decision)}/#{message.id}/reconcile", params: { hiring_message: attributes.merge(worker_stopped: true) }, as: :json
    expect(response).to have_http_status(:ok)
    expect(HiringMessage.count).to eq(1)
    intent = preview(decision).fetch("intent")
    post "#{path(decision)}/#{message.id}/retry", params: { hiring_message: intent.merge("message_version" => message.reload.lock_version) }, as: :json
    expect(response).to have_http_status(:created)
    expect(HiringMessage.count).to eq(2)
    expect(HiringMessage.last.original_message_id).to eq(message.id)
  end

  it "denies revoked Admins and rejects an automatic flag from the browser" do
    approve_rejection
    decision = finalized
    intent = preview(decision).fetch("intent")
    post path(decision), params: { hiring_message: intent.merge("automatic" => true) }, as: :json
    expect(response).to have_http_status(:bad_request)
    admin.remove_role(:admin, company)
    post path(decision), params: { hiring_message: intent }, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(HiringMessage.count).to eq(0)
  end
end

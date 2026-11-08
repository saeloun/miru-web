# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Internal feedback notice recovery", type: :request do
  include_context "interview message records"

  before do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
    sign_in admin
  end

  let(:feedback) { booking.hiring_feedbacks.sole }
  let(:message) { company.hiring_messages.find_by!(kind: "feedback_prompt") }
  let(:notice_path) { "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/feedback/#{feedback.id}/messages" }

  def post_preview
    post "#{notice_path}/preview", params: { hiring_message: { company_id: company.id, kind: message.kind, mailbox_id: mailbox.id } }, as: :json
  end

  it "returns private bounded attempt history and previews before an explicit retry" do
    message.update!(state: "failed", error_code: "transport_rejected")
    get notice_path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok), response.body
    record = response.parsed_body.fetch("messages").sole
    expect(record).to include("retryable" => true, "lock_version" => message.lock_version, "attempt_number" => 1)
    expect(record.fetch("content").keys.sort).to eq(%w[body reply_to subject to])
    expect(response.headers["Cache-Control"]).to include("no-store")
    post_preview
    expect(response).to have_http_status(:ok), response.body
    intent = response.parsed_body.fetch("preview").fetch("intent")
    expect(company.hiring_messages.count).to eq(1)
    post "#{notice_path}/#{message.id}/retry", params: { hiring_message: intent.merge("message_version" => message.lock_version) }, as: :json
    expect(response).to have_http_status(:created), response.body
    expect(response.parsed_body.dig("message", "original_message_id")).to eq(message.id)
    expect(company.hiring_messages.count).to eq(2)
  end

  it "records delivery evidence without sending and refuses a repeated or stale resolution" do
    message.update!(state: "uncertain", error_code: "transport_unknown")
    attributes = { company_id: company.id, message_version: message.lock_version, outcome: "accepted", evidence: "Local SMTP accepted DATA", worker_stopped: false }
    application.reload.update!(stage: "withdrawn")
    post "#{notice_path}/#{message.id}/reconcile", params: { hiring_message: attributes }, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("message", "resolution")).to eq("accepted")
    expect(company.hiring_messages.count).to eq(1)
    post "#{notice_path}/#{message.id}/reconcile", params: { hiring_message: attributes }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "denies interviewers and removed Admins without leaking internal content" do
    sign_out admin
    sign_in interviewer
    get notice_path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("Approved feedback_prompt", interviewer.email)
    sign_out interviewer
    sign_in admin
    admin.remove_role(:admin, company)
    post_preview
    expect(response).to have_http_status(:forbidden)
  end

  it "rejects unrelated feedback, application and message IDs" do
    get notice_path.sub("/feedback/#{feedback.id}/", "/feedback/999999999/"), params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => "other@example.test" }).process
    get notice_path.sub("/applications/#{application.id}/", "/applications/#{other.id}/"), params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    post "#{notice_path}/999999999/reconcile", params: { hiring_message: { company_id: company.id, message_version: 0,
      outcome: "accepted", evidence: "Capture", worker_stopped: false } }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "rejects another workspace and unapproved preview fields" do
    post "#{notice_path}/preview", params: { hiring_message: { company_id: create(:company).id, kind: message.kind, mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:conflict)
    post "#{notice_path}/preview", params: { hiring_message: { company_id: company.id, kind: message.kind, mailbox_id: mailbox.id, body: "Injected" } }, as: :json
    expect(response).to have_http_status(:bad_request)
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Internal feedback notification history", type: :request do
  include_context "interview message records"

  before do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
    sign_in admin
  end

  def history_path = "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/feedback"

  it "returns bounded frozen delivery content only in the Admin history" do
    get history_path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    notice = response.parsed_body.fetch("feedbacks").sole.fetch("notifications").sole
    expect(notice.keys.sort).to eq(%w[content error_code id kind sent_at state])
    expect(notice.fetch("content").keys.sort).to eq(%w[body reply_to subject to])
    expect(notice.dig("content", "to")).to eq(interviewer.email)
    expect(notice.dig("content", "body")).not_to include("PRIVATE")

    sign_out admin
    sign_in interviewer
    get "/api/v1/hiring/interview_feedback/#{booking.hiring_feedbacks.sole.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("feedback")).not_to have_key("notifications")
    get history_path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(interviewer.email, "Approved feedback_prompt")
  end

  it "denies another application or a removed Admin without returning delivery content" do
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => "other@example.test" }).process
    get "/api/v1/hiring/applications/#{other.id}/interviews/#{round.id}/feedback", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    admin.remove_role(:admin, company)
    get history_path, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include(interviewer.email, "Approved feedback_prompt")
  end

  it "keeps internal notices out of receipt acknowledgement history and recovery controls" do
    receipt = HiringReceipt.create!(company:, hiring_mailbox: mailbox, hiring_application: application, state: "accepted",
      source_checksum: SecureRandom.hex(32), received_at: Time.current,
      details: { "source_name" => mailbox.name, "source_email" => mailbox.source_email })
    get "/api/v1/hiring/receipts/#{receipt.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("messages")).to be_empty
    message = HiringMessage.sole
    post "/api/v1/hiring/receipts/#{receipt.id}/messages/#{message.id}/reconcile", params: {
      hiring_message: { company_id: company.id, lock_version: message.lock_version,
        outcome: "accepted", evidence: "Synthetic provider acceptance", worker_stopped: true }
    }, as: :json
    expect(response).to have_http_status(:not_found)
    expect(message.reload.resolution).to be_nil
  end
end

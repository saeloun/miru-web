# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview candidate messages" do
  include_context "interview message records"

  def preview(kind = "interview_invitation")
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind:, mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:ok)
    response.parsed_body.fetch("preview")
  end

  def queue(content)
    post path, params: { hiring_message: content.fetch("intent") }, as: :json
  end

  before { sign_in admin }

  it "lists booking communications privately without sending from scheduling" do
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("messages")).to eq([])
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(HiringMessage.count).to eq(0)
    expect(response.body).not_to include("PRIVATE")
  end

  it "requires approval, previews only public booking fields and recovers the original queued intent" do
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_invitation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(422)
    setting = approve
    content = preview
    expect(content.fetch("body")).to include("2026-11-09 14:30:00 +05:30", "Asia/Kolkata", "Bring a project", interviewer.full_name,
      "https://meet.example.test/synthetic", "Contact the hiring team to reschedule")
    expect(content.to_json).not_to include("PRIVATE", "feedback_due", "salary", "compensation_access")
    queue(content)
    expect(response).to have_http_status(:created)
    message = HiringMessage.sole
    expect(message.approved_setting_version).to eq(setting.lock_version)
    expect(message.event_key).to eq("booking:#{booking.id}")
    expect(message.read_attribute_before_type_cast(:content)).not_to include(content.fetch("body"))
    queue(content)
    expect(response).to have_http_status(:ok)
    expect(HiringMessage.count).to eq(1)
    expect(message.reload.state).to eq("queued")
    expect { message.update!(event_key: "booking:999") }.to raise_error(ActiveRecord::RecordInvalid)
    queue(content.merge("intent" => content.fetch("intent").merge("recipient" => "changed@example.test")))
    expect(response).to have_http_status(:conflict)
  end

  it "rejects stale versions, unsupported fields, inactive inboxes and missing templates" do
    approve
    content = preview
    %w[application_version interview_version booking_version mailbox_version setting_version].each do |key|
      queue(content.merge("intent" => content.fetch("intent").merge(key => content.fetch("intent").fetch(key) + 1)))
      expect(response).to have_http_status(:conflict)
    end
    queue(content.merge("intent" => content.fetch("intent").merge("body" => "PRIVATE forged body")))
    expect(response).to have_http_status(:bad_request)
    mailbox.update!(active: false)
    queue(content)
    expect(response).to have_http_status(422)
    mailbox.update!(active: true)
    setting = company.hiring_setting.reload
    setting.update!(details: setting.details.merge("interview_invitation_body" => ""))
    setting.update!(approved_at: Time.current, approved_by: admin)
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_invitation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(422)
    expect(HiringMessage.count).to eq(0)
  end

  it "keeps cancellation reasons, links and internal assessment data out of candidate cancellation mail" do
    approve
    booking.end!(status: "cancelled", reason: "PRIVATE CANCEL REASON")
    content = preview("interview_cancellation")
    expect(content.fetch("body")).to include("This booking is cancelled", "2026-11-09")
    expect(content.fetch("body")).not_to include("PRIVATE", "https://meet", "Bring a project")
    queue(content)
    expect(response).to have_http_status(:created)
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_confirmation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(422)
  end

  it "uses separate booking operation identities and preserves each retry's kind and key" do
    approve
    first = preview("interview_confirmation")
    queue(first)
    original = HiringMessage.sole
    previous_path = path
    replacement = Hiring::Scheduling.new(interview: round.reload, actor: admin).create!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version, "interview_version" => round.lock_version,
      "request_key" => SecureRandom.uuid, "starts_local" => "2026-11-10T14:30", "candidate_time_zone" => "Asia/Kolkata",
      "feedback_hours" => 24, "meeting_url" => "https://meet.example.test/replacement", "booking_instructions" => "Reply to reschedule",
      "previous_booking_id" => booking.id, "reason" => "PRIVATE REPLACEMENT REASON"
    })
    replacement_path = previous_path.sub("/bookings/#{booking.id}/", "/bookings/#{replacement.id}/")
    %w[interview_confirmation interview_reschedule].each do |kind|
      post "#{replacement_path}/preview", params: { hiring_message: { company_id: company.id, kind:, mailbox_id: mailbox.id } }, as: :json
      expect(response).to have_http_status(:ok)
      content = response.parsed_body.fetch("preview")
      post replacement_path, params: { hiring_message: content.fetch("intent") }, as: :json
      expect(response).to have_http_status(:created)
    end
    expect(HiringMessage.operations.count).to eq(3)
    expect(Hiring::InterviewCommunication.blocked_reason(original.reload)).to eq("interview_changed")
    different = HiringMessage.where.not(id: original.id).first
    expect { different.update!(original_message: original, attempt_number: 2) }.to raise_error(ActiveRecord::RecordInvalid)
    expect { HiringMessage.create!(original.attributes.except("id", "created_at", "updated_at")) }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "records uncertain delivery evidence without sending and requires explicit latest-attempt retry" do
    approve
    content = preview
    queue(content)
    original = HiringMessage.sole
    original.update!(state: "uncertain", error_code: "transport_unknown")
    retry_path = "#{path}/#{original.id}/retry"
    post retry_path, params: { hiring_message: content.fetch("intent").merge("message_version" => original.lock_version) }, as: :json
    expect(response).to have_http_status(:conflict)
    review = { company_id: company.id, message_version: original.lock_version, outcome: "not_accepted", evidence: "Verified local capture and stopped worker", worker_stopped: false }
    post "#{path}/#{original.id}/reconcile", params: { hiring_message: review }, as: :json
    expect(response).to have_http_status(422)
    post "#{path}/#{original.id}/reconcile", params: { hiring_message: review.merge(worker_stopped: true) }, as: :json
    expect(response).to have_http_status(:ok)
    expect(HiringMessage.count).to eq(1)
    post retry_path, params: { hiring_message: content.fetch("intent").merge("message_version" => original.reload.lock_version) }, as: :json
    expect(response).to have_http_status(:created)
    latest = original.attempts.order(:attempt_number).last
    expect(latest.attempt_number).to eq(2)
    expect(latest.original_message_id).to eq(original.id)
    expect(latest.event_key).to eq(original.event_key)
    post retry_path, params: { hiring_message: content.fetch("intent").merge("message_version" => original.lock_version) }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(HiringMessage.count).to eq(2)
  end

  it "denies employee, ended membership and foreign-workspace message access" do
    url = path
    sign_out admin
    sign_in interviewer
    get url, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_out interviewer
    sign_in admin
    other = create(:company)
    other_admin = create(:user, current_workspace: other)
    create(:employment, company: other, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other)
    foreign = Hiring::Intake.new(company: other, actor: other_admin, attributes: { "company_id" => other.id,
      "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
    get url.sub("/applications/#{application.id}/", "/applications/#{foreign.id}/"), params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    membership.update!(resigned_at: Date.yesterday)
    get url, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("PRIVATE")
  end

  it "validates editable templates without changing the approved saved values" do
    setting = approve
    [{ "interview_invitation_subject" => "Injected\r\nBcc: other@example.test" }, { "interview_confirmation_body" => [] },
      { "interview_cancellation_subject" => "x" * 201 }].each do |change|
      put "/api/v1/hiring/settings", params: { hiring_setting: { company_id: company.id, lock_version: setting.lock_version,
        details: setting.details.merge(change) } }, as: :json
      expect(response).to have_http_status(422)
      expect(setting.reload.approved?).to be(true)
    end
  end

  it "paginates attempt history and offers retry only for the latest attempt" do
    approve
    queue(preview)
    original = HiringMessage.sole
    original.update!(state: "failed", error_code: "delivery_disabled")
    2.upto(21) do |number|
      HiringMessage.create!(original.attributes.except("id", "created_at", "updated_at").merge("original_message_id" => original.id,
        "attempt_number" => number))
    end
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("messages").size).to eq(20)
    expect(data.fetch("messages").count { |message| message.fetch("retryable") }).to eq(1)
    expect(data.dig("messages", 0, "attempt_number")).to eq(21)
    expect(data.dig("pagination", "has_more")).to be(true)
    get path, params: { company_id: company.id, page: 2 }
    expect(response.parsed_body.fetch("messages").pluck("id")).to eq([original.id])
    expect(response.parsed_body.dig("messages", 0, "retryable")).to be(false)
    attributes = original.attributes.except("id", "created_at", "updated_at").merge("original_message_id" => original.id,
      "attempt_number" => 22, "event_key" => "booking:999")
    expect { HiringMessage.create!(attributes) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "refuses schema rollback before changing recorded interview message history" do
    approve
    queue(preview)
    require Rails.root.join("db/migrate/20261107143000_add_hiring_message_events")
    require Rails.root.join("db/migrate/20261107144000_index_hiring_message_events")
    expect { IndexHiringMessageEvents.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect { AddHiringMessageEvents.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect(HiringMessage.sole.event_key).to eq("booking:#{booking.id}")
    expect(ActiveRecord::Base.connection.index_exists?(:hiring_messages, name: "index_hiring_messages_on_original_operation")).to be(true)
  end
end

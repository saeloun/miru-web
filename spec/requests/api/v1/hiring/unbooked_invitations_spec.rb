# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Unbooked interview invitations" do
  include_context "interview message records"
  let(:path) { "/api/v1/hiring/applications/#{application.id}/interviews/#{round.id}/messages" }
  let(:panel) do
    HiringPanelMember.create!(company:, employment: staff, details: { "expertise" => "PRIVATE EXPERTISE",
      "availability" => "PRIVATE AVAILABILITY", "booking_url" => "https://calendar.example.test/book" })
  end
  before { sign_in admin }

  def preview
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_invitation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:ok)
    response.parsed_body.fetch("preview")
  end

  def queue(content)
    post path, params: { hiring_message: content.fetch("intent") }, as: :json
  end

  it "opens round invitation history without creating a booking or sending email" do
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("messages")).to eq([])
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(HiringInterviewBooking.count).to eq(0)
    expect(HiringMessage.count).to eq(0)
  end

  it "previews only public booking links, records null booking state and recovers accepted historical intent" do
    approve
    content = preview
    expect(content.fetch("body")).to include("No interview time is confirmed", "Bring a project", "https://calendar.example.test/book", interviewer.full_name)
    expect(content.fetch("body")).not_to include("PRIVATE", "Time:", "2026-", "feedback_due", "compensation_access")
    expect(content.dig("intent", "booking_version")).to be_nil
    version = round.reload.lock_version
    queue(content)
    expect(response).to have_http_status(:created)
    message = HiringMessage.sole
    expect(message.event_key).to eq("round:#{round.id}:#{version}")
    expect(message.read_attribute_before_type_cast(:content)).not_to include(content.fetch("body"))
    change_round
    queue(content)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("message", "id")).to eq(message.id)
    expect(HiringMessage.count).to eq(1)
    expect(HiringInterviewBooking.count).to eq(0)
  end

  it "provides a reply fallback when no panel booking URL is configured" do
    approve
    panel
    round
    panel.update!(details: panel.details.except("booking_url"))
    change_round
    body = preview.fetch("body")
    expect(body).to include("No interview time is confirmed", "reply to the hiring team")
    expect(body).not_to include("booking links below", "https://calendar")
  end

  it "rejects fake booking versions, unsupported message types, stale intent and forged content" do
    approve
    content = preview
    queue(content.merge("intent" => content.fetch("intent").merge("booking_version" => 0)))
    expect(response).to have_http_status(422)
    %w[application_version interview_version mailbox_version setting_version].each do |key|
      queue(content.merge("intent" => content.fetch("intent").merge(key => content.fetch("intent").fetch(key) + 1)))
      expect(response).to have_http_status(:conflict)
    end
    queue(content.merge("intent" => content.fetch("intent").merge("body" => "forged")))
    expect(response).to have_http_status(:bad_request)
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_confirmation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(422)
    expect(HiringMessage.count).to eq(0)
  end

  it "invalidates an older unsent invitation only after confirming the new round revision" do
    approve
    first = preview
    queue(first)
    original = HiringMessage.sole
    change_round
    updated = preview
    expect(original.reload.state).to eq("queued")
    queue(updated)
    expect(response).to have_http_status(:created)
    expect(HiringMessage.operations.count).to eq(2)
    expect(original.reload.state).to eq("failed")
    expect(original.error_code).to eq("interview_changed")
    expect(original.content.fetch("body")).to include("Preparation: Bring a project")
    get path, params: { company_id: company.id }
    expect(response.parsed_body.fetch("messages").pluck("current_context")).to eq([true, false])
    expect(response.parsed_body.dig("messages", 1, "retryable")).to be(false)
    post "#{path}/#{original.id}/retry", params: { hiring_message: first.fetch("intent").merge("message_version" => original.lock_version) }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(HiringMessage.count).to eq(2)
  end

  %w[sending uncertain].each do |state|
    it "blocks replacement while an earlier invitation is #{state}" do
      approve
      queue(preview)
      original = HiringMessage.sole
      original.update!(state:, started_at: Time.current)
      change_round
      post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_invitation", mailbox_id: mailbox.id } }, as: :json
      expect(response).to have_http_status(:conflict)
      expect(response.parsed_body.fetch("errors")).to include("earlier invitation")
      expect(HiringMessage.count).to eq(1)
    end
  end

  it "allows a revised invitation after evidenced non-acceptance without rewriting the earlier attempt" do
    approve
    queue(preview)
    original = HiringMessage.sole
    original.update!(state: "uncertain", error_code: "transport_unknown")
    change_round
    post "#{path}/#{original.id}/reconcile", params: { hiring_message: { company_id: company.id, message_version: original.lock_version,
      outcome: "not_accepted", evidence: "Verified local capture; original worker stopped", worker_stopped: true } }, as: :json
    expect(response).to have_http_status(:ok)
    expect(HiringMessage.count).to eq(1)
    queue(preview)
    expect(response).to have_http_status(:created)
    expect(HiringMessage.operations.count).to eq(2)
    expect(original.reload.state).to eq("uncertain")
    expect(original.resolution).to eq("not_accepted")
  end

  it "rechecks a claim observed after loading older queued rows before making another operation" do
    approve
    queue(preview)
    original = HiringMessage.sole
    change_round
    content = preview
    observed = false
    allow_any_instance_of(HiringMessage).to receive(:with_lock).and_wrap_original do |method, *arguments, &block|
      message = method.receiver
      if message.id == original.id && !observed
        observed = true
        message.update!(state: "sending", started_at: Time.current)
      end
      method.call(*arguments, &block)
    end
    queue(content)
    expect(response).to have_http_status(:conflict)
    expect(observed).to be(true)
    expect(HiringMessage.count).to eq(1)
  end

  it "requires refreshing changed panel profiles and uses their current approved round snapshot" do
    approve
    preview
    panel.update!(details: panel.details.merge("booking_url" => "https://calendar.example.test/updated"))
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_invitation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(:conflict)
    change_round
    expect(preview.fetch("body")).to include("https://calendar.example.test/updated")
  end

  it "blocks new unbooked invitations after a meeting is recorded while retaining original recovery" do
    approve
    content = preview
    queue(content)
    original = HiringMessage.sole
    booking
    post "#{path}/preview", params: { hiring_message: { company_id: company.id, kind: "interview_invitation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(422)
    queue(content)
    expect(response).to have_http_status(:ok)
    expect(Hiring::InterviewCommunication.blocked_reason(original.reload)).to eq("interview_changed")
    expect(HiringMessage.count).to eq(1)
    expect(HiringInterviewBooking.count).to eq(1)
  end

  it "denies a round from another application, employee reads and ended Admin employment" do
    url = path
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
    get url.sub("/applications/#{application.id}/", "/applications/#{other.id}/"), params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    sign_out admin
    sign_in interviewer
    get url, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_out interviewer
    sign_in admin
    membership.update!(resigned_at: Date.yesterday)
    get url, params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "preserves recorded invitations when rollback is requested" do
    approve
    queue(preview)
    require Rails.root.join("db/migrate/20261107150000_allow_unbooked_hiring_invitations")
    expect { AllowUnbookedHiringInvitations.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect(HiringMessage.sole.event_key).to start_with("round:")
  end

  it "enforces invitation-only round events in PostgreSQL" do
    approve
    queue(preview)
    original = HiringMessage.sole
    expect do
      HiringMessage.transaction(requires_new: true) do
        HiringMessage.create!(original.attributes.except("id", "created_at", "updated_at").merge("kind" => "interview_cancellation"))
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /hiring_message_event/)
    expect(HiringMessage.count).to eq(1)
  end

  it "does not select a booking context through query parameters on the unbooked route" do
    approve
    booking
    post "#{path}/preview?booking_id=#{booking.id}", params: { hiring_message: { company_id: company.id,
      kind: "interview_confirmation", mailbox_id: mailbox.id } }, as: :json
    expect(response).to have_http_status(422)
    expect(HiringMessage.count).to eq(0)
  end
end

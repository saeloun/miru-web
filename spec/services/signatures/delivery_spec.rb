# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved signature delivery" do
  include SignatureRequestFixtures
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:origin) { "https://signing.example.test" }
  let(:client) { instance_double(Signatures::DocumensoClient, origin:) }
  let(:source) { Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf") }
  let(:bytes) { File.binread(source) }

  before do
    admin.add_role(:owner, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(origin)
    allow(Signatures::DocumensoClient).to receive(:new).and_return(client)
    @connection = SignatureConnection.create!(company:, created_by: admin, provider_origin: origin, api_key: "api_synthetic_key")
    @record = approved_signature_request(company:, actor: admin)
    @revision = @record.reload.current_revision
  end

  def context = signature_context(@record)

  def request_operation(kind, **attributes)
    Signatures::Operations.new(@record, actor: admin, attributes: context.merge(attributes)).public_send(kind)
  end

  def provider_record(status = "DRAFT")
    payload = Signatures::Envelope.new(@revision.reload).payload(operation_id: @revision.operation_id)
    person = payload.fetch("recipients").first
    { "id" => "envelope_synthetic", "title" => @revision.title, "type" => "DOCUMENT", "status" => status,
      "externalId" => @revision.operation_id, "authOptions" => nil, "documentMeta" => payload.fetch("meta"),
      "envelopeItems" => [{ "id" => "item_synthetic", "envelopeId" => "envelope_synthetic", "order" => 0 }],
      "recipients" => [person.except("fields", "accessAuth", "actionAuth").merge("id" => 1, "envelopeId" => "envelope_synthetic",
        "authOptions" => nil, "signingStatus" => "NOT_SIGNED", "sendStatus" => status == "DRAFT" ? "NOT_SENT" : "SENT",
        "readStatus" => "NOT_OPENED")],
      "fields" => person.fetch("fields").each_with_index.map do |field, index|
        field.except("identifier").merge("id" => index + 1, "envelopeId" => "envelope_synthetic",
          "envelopeItemId" => "item_synthetic", "recipientId" => 1, "customText" => "", "inserted" => false)
      end }
  end

  def allow_provider
    allow(client).to receive(:create).and_return("id" => "envelope_synthetic")
    allow(client).to receive(:original).with("item_synthetic").and_return(bytes)
    allow(client).to receive(:get).with("envelope_synthetic").and_return(provider_record, provider_record("PENDING"))
    allow(client).to receive(:distribute).with("envelope_synthetic") do
      expect(@revision.reload.provider_envelope_id).to eq("envelope_synthetic")
      { "success" => true }
    end
  end

  it "queues the approved immutable version and creates and distributes it only once" do
    operation = request_operation(:send_request)
    expect(@revision.reload).to have_attributes(status: "sending", signature_connection_id: @connection.id, operation_id: operation.key)
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.last[:args]).to eq([operation.id])
    allow_provider
    nested = false
    allow(client).to receive(:create) do
      unless nested
        nested = true
        SignatureDeliveryJob.perform_now(operation.id)
      end
      { "id" => "envelope_synthetic" }
    end
    2.times { SignatureDeliveryJob.perform_now(operation.id) }
    expect(client).to have_received(:create).once.with(payload: hash_including("externalId" => operation.key), files: [bytes])
    expect(client).to have_received(:distribute).once
    expect(@revision.reload).to have_attributes(status: "awaiting_signatures", provider_status: "PENDING")
    expect(operation.reload.state).to eq("confirmed")
    expect(@revision.recipient_statuses).to contain_exactly(hash_including("recipient_id" => "signer", "signing_status" => "NOT_SIGNED"))
    expect(@record.audits.where(action: "send_confirmed")).to exist
  end

  it "denies stale approval, missing company credentials and a revoked sender before any external call" do
    @revision.update!(approval_digest: "b" * 64)
    expect { request_operation(:send_request) }.to raise_error(SignatureRequest::Conflict, /approval/)
    @revision.update!(approval_digest: @revision.content_digest)
    @connection.update!(disabled_at: Time.current)
    expect { request_operation(:send_request) }.to raise_error(SignatureRequest::Conflict, /Connect/)
    @connection.update!(disabled_at: nil)
    membership.update_columns(resigned_at: Date.yesterday)
    expect { request_operation(:send_request) }.to raise_error(Pundit::NotAuthorizedError)
    expect(SignatureOperation.count).to eq(0)
  end

  it "rechecks membership in the job's company and ignores unrelated workspace changes" do
    operation = request_operation(:send_request)
    admin.update!(current_workspace: create(:company))
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    expect(operation.reload.state).to eq("confirmed")
    expect(client).to have_received(:distribute).once
  end

  it "stops a revoked sender and permits a new version without creating an envelope" do
    operation = request_operation(:send_request)
    membership.update_columns(resigned_at: Date.yesterday)
    SignatureDeliveryJob.perform_now(operation.id)
    expect(operation.reload).to have_attributes(state: "failed", error_code: "not_authorized")
    expect(@revision.reload.status).to eq("cancelled")
    expect(@revision.provider_envelope_id).to be_nil
  end

  it "never repeats an ambiguous create and adopts only a fully verified matching provider ID" do
    operation = request_operation(:send_request)
    allow(client).to receive(:create).and_raise(Signatures::DocumensoClient::Uncertain, "private provider trace")
    2.times { SignatureDeliveryJob.perform_now(operation.id) }
    expect(client).to have_received(:create).once
    expect(operation.reload).to have_attributes(state: "uncertain", phase: "creating")
    expect(@revision.reload.status).to eq("send_uncertain")
    expect(operation.error_message).not_to include("private provider trace")

    wrong = provider_record.merge("id" => "envelope_other", "externalId" => "another_operation")
    allow(client).to receive(:get).with("envelope_other").and_return(wrong)
    rejected = request_operation(:refresh, provider_envelope_id: "envelope_other")
    SignatureDeliveryJob.perform_now(rejected.id)
    expect(rejected.reload).to have_attributes(state: "failed", error_code: "provider_mismatch")
    expect(@revision.reload.provider_envelope_id).to be_nil

    allow_provider
    allow(client).to receive(:get).and_return(provider_record, provider_record, provider_record("PENDING"))
    refresh = request_operation(:refresh, provider_envelope_id: "envelope_synthetic")
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(@revision.reload.provider_envelope_id).to eq("envelope_synthetic")
    SignatureDeliveryJob.perform_now(operation.id)
    expect(client).to have_received(:create).once
    expect(client).to have_received(:distribute).once
    expect(@revision.reload.status).to eq("awaiting_signatures")
  end

  it "keeps distribution uncertain instead of retrying when the provider still reports a draft" do
    operation = request_operation(:send_request)
    allow_provider
    allow(client).to receive(:distribute).and_raise(Signatures::DocumensoClient::Uncertain)
    SignatureDeliveryJob.perform_now(operation.id)
    allow(client).to receive(:get).and_return(provider_record)
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    SignatureDeliveryJob.perform_now(operation.id)
    expect(client).to have_received(:distribute).once
    expect(@revision.reload.status).to eq("send_uncertain")
    expect(operation.reload.state).to eq("uncertain")
    expect { @record.with_lock { @record.revise!(actor: admin, attributes: { title: "Unsafe duplicate" }) } }
      .to raise_error(SignatureRequest::Conflict)
  end

  it "rejects a changed provider source or configuration before distributing" do
    operation = request_operation(:send_request)
    allow_provider
    changed = provider_record
    changed.fetch("fields").first["page"] = 99
    allow(client).to receive(:get).and_return(changed)
    SignatureDeliveryJob.perform_now(operation.id)
    expect(operation.reload).to have_attributes(state: "failed", error_code: "provider_mismatch")
    expect(client).not_to have_received(:distribute)
  end

  it "does not queue cancellation after authoritative completion while archival is pending" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    @revision.reload.update!(provider_status: "COMPLETED")
    expect { request_operation(:cancel) }.to raise_error(SignatureRequest::Conflict)
  end

  it "cancels a queued send locally and never creates its provider envelope" do
    send_operation = request_operation(:send_request)
    cancel_operation = request_operation(:cancel)
    SignatureDeliveryJob.perform_now(cancel_operation.id)
    SignatureDeliveryJob.perform_now(send_operation.id)
    expect(@revision.reload.status).to eq("cancelled")
    expect(cancel_operation.reload.state).to eq("confirmed")
    expect(@revision.provider_envelope_id).to be_nil
  end

  it "retains an undistributed draft when cancellation races with creation" do
    operation = request_operation(:send_request)
    allow_provider
    allow(client).to receive(:create) do
      request_operation(:cancel)
      { "id" => "envelope_synthetic" }
    end
    SignatureDeliveryJob.perform_now(operation.id)
    cancel_operation = @revision.signature_operations.find_by!(kind: "cancel")
    SignatureDeliveryJob.perform_now(cancel_operation.id)
    expect(@revision.reload).to have_attributes(status: "cancelled", provider_envelope_id: "envelope_synthetic")
    expect(client).not_to have_received(:distribute)
  end

  it "checks actual cancellation and never downgrades it using an older pending response" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    cancel_operation = request_operation(:cancel)
    allow(client).to receive(:get).and_return(provider_record("PENDING"), provider_record("CANCELLED"))
    allow(client).to receive(:cancel).with("envelope_synthetic").and_return("success" => true)
    2.times { SignatureDeliveryJob.perform_now(cancel_operation.id) }
    expect(client).to have_received(:cancel).once
    expect(@revision.reload.status).to eq("cancelled")
    allow(client).to receive(:get).and_return(provider_record("PENDING"))
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(@revision.reload.status).to eq("cancelled")
  end

  it "reminds only pending actionable recipients once and enforces a daily cooldown" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    reminder = request_operation(:remind)
    allow(client).to receive(:get).and_return(provider_record("PENDING"))
    allow(client).to receive(:remind).with("envelope_synthetic", recipient_ids: [1]).and_return("success" => true)
    2.times { SignatureDeliveryJob.perform_now(reminder.id) }
    expect(client).to have_received(:remind).once
    expect { request_operation(:remind) }.to raise_error(SignatureRequest::Conflict, /24 hours/)
  end

  it "does not manufacture a signed archive from the provider's completed status" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    data = provider_record("COMPLETED")
    data.fetch("recipients").first["signingStatus"] = "SIGNED"
    allow(client).to receive(:get).and_return(data)
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(@revision.reload.provider_status).to eq("COMPLETED")
    expect(@revision.status).not_to eq("signed")
  end

  it "does not change a version's bound credentials or provider identity" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    other = SignatureConnection.create!(company: create(:company), created_by: admin,
      provider_origin: origin, api_key: "api_other_company")
    expect(@revision.update(signature_connection: other)).to be(false)
    expect(@revision.reload.update(provider_envelope_id: "envelope_other")).to be(false)
    expect(@revision.reload.update(operation_id: SecureRandom.uuid)).to be(false)
    expect(@revision.reload).to have_attributes(signature_connection_id: @connection.id, provider_envelope_id: "envelope_synthetic")
  end

  it "rejects a provider response that reverses a recorded signature" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    signed = provider_record("PENDING")
    signed.fetch("recipients").first["signingStatus"] = "SIGNED"
    allow(client).to receive(:get).and_return(signed)
    first = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(first.id)
    allow(client).to receive(:get).and_return(provider_record("PENDING"))
    second = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(second.id)
    expect(second.reload).to have_attributes(state: "failed", error_code: "provider_mismatch")
    expect(@revision.reload.recipient_statuses.first.fetch("signing_status")).to eq("SIGNED")
  end

  it "does not treat an interrupted creation as safe to retry" do
    operation = request_operation(:send_request)
    operation.update!(state: "running", phase: "creating", run_token: SecureRandom.uuid, updated_at: 3.minutes.ago)
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(operation.reload).to have_attributes(state: "uncertain", phase: "creating")
    expect(@revision.reload.provider_envelope_id).to be_nil
  end

  it "recovers queue failure without changing the send identity" do
    allow(SignatureDeliveryJob).to receive(:perform_later).and_return(false)
    operation = request_operation(:send_request)
    expect(operation.reload.state).to eq("failed")
    expect(operation.error_code).to eq("queue_unavailable")
    allow(SignatureDeliveryJob).to receive(:perform_later).and_call_original
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(operation.reload.state).to eq("queued")
    expect(@revision.reload.operation_id).to eq(operation.key)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    expect(client).to have_received(:create).once
    expect(@record.audits.where(action: "send_queue_failed").count).to eq(1)
  end

  it "recovers stalled preparation before any provider mutation" do
    operation = request_operation(:send_request)
    operation.update!(state: "running", phase: "preparing", run_token: SecureRandom.uuid, updated_at: 3.minutes.ago)
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(operation.reload).to have_attributes(state: "queued", run_token: nil)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    expect(client).to have_received(:create).once
    expect(@revision.reload.status).to eq("awaiting_signatures")
  end

  it "recovers a worker crash after creation by verifying and reusing the known envelope" do
    operation = request_operation(:send_request)
    allow_provider
    crash = Class.new(StandardError)
    allow(client).to receive(:get).and_raise(crash, "Synthetic worker crash")
    expect { SignatureDeliveryJob.perform_now(operation.id) }.to raise_error(crash)
    expect(operation.reload.phase).to eq("verifying")
    expect(@revision.reload.provider_envelope_id).to eq("envelope_synthetic")
    operation.update_column(:updated_at, 3.minutes.ago)
    allow(client).to receive(:get).and_return(provider_record, provider_record, provider_record("PENDING"))
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(operation.reload.state).to eq("queued")
    SignatureDeliveryJob.perform_now(operation.id)
    expect(client).to have_received(:create).once
    expect(client).to have_received(:distribute).once
    expect(@revision.reload.status).to eq("awaiting_signatures")
  end

  it "does not overwrite a running job's result when the queue adapter reports failure late" do
    allow(SignatureDeliveryJob).to receive(:perform_later) do |id|
      allow_provider
      SignatureDeliveryJob.perform_now(id)
      false
    end
    operation = request_operation(:send_request)
    expect(operation.reload.state).to eq("confirmed")
    expect(@revision.reload.status).to eq("awaiting_signatures")
    expect(client).to have_received(:create).once
    expect(@record.audits.where(action: "send_queue_failed")).not_to exist
  end

  it "continues cancellation after distribution finishes instead of leaving it waiting forever" do
    operation = request_operation(:send_request)
    allow_provider
    allow(client).to receive(:cancel).and_return("success" => true)
    allow(client).to receive(:distribute) do
      cancellation = request_operation(:cancel)
      allow(client).to receive(:get).and_return(provider_record)
      SignatureDeliveryJob.perform_now(cancellation.id)
      expect(cancellation.reload.state).to eq("waiting")
      allow(client).to receive(:get).and_return(provider_record("PENDING"))
      { "success" => true }
    end
    SignatureDeliveryJob.perform_now(operation.id)
    cancellation = @revision.signature_operations.find_by!(kind: "cancel")
    expect(cancellation.reload.state).to eq("queued")
    allow(client).to receive(:get).and_return(provider_record("PENDING"), provider_record("CANCELLED"))
    SignatureDeliveryJob.perform_now(cancellation.id)
    expect(client).to have_received(:distribute).once
    expect(client).to have_received(:cancel).once
    expect(@revision.reload.status).to eq("cancelled")
  end

  it "reconciles an ambiguous cancellation without repeating the cancellation request" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    cancellation = request_operation(:cancel)
    allow(client).to receive(:get).and_return(provider_record("PENDING"))
    allow(client).to receive(:cancel).and_raise(Signatures::DocumensoClient::Uncertain)
    2.times { SignatureDeliveryJob.perform_now(cancellation.id) }
    expect(cancellation.reload.state).to eq("uncertain")
    allow(client).to receive(:get).and_return(provider_record("CANCELLED"))
    refresh = request_operation(:refresh)
    SignatureDeliveryJob.perform_now(refresh.id)
    expect(cancellation.reload.state).to eq("confirmed")
    expect(client).to have_received(:cancel).once
    expect(@revision.reload.status).to eq("cancelled")
  end

  it "queues at most three automatic reminders three days apart without duplicate scheduler deliveries" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    allow(client).to receive(:get).and_return(provider_record("PENDING"))
    allow(client).to receive(:remind).and_return("success" => true)
    admin.update!(current_workspace: create(:company))
    started_at = Time.current
    4.times do |index|
      travel_to(started_at + (index + 1) * 4.days) do
        2.times { SignatureRemindersJob.perform_now }
        reminder = @revision.signature_operations.where(kind: "remind", state: "queued").first
        2.times { SignatureDeliveryJob.perform_now(reminder.id) } if reminder
      end
    end
    expect(@revision.reload).to have_attributes(automatic_reminders_count: 3, next_reminder_at: nil)
    expect(@revision.signature_operations.where(kind: "remind").count).to eq(3)
    expect(client).to have_received(:remind).exactly(3).times
  end

  it "records why automatic reminders stopped after the sender lost access" do
    operation = request_operation(:send_request)
    allow_provider
    SignatureDeliveryJob.perform_now(operation.id)
    membership.update_columns(resigned_at: Date.yesterday)
    travel_to(Time.current + 4.days) { 2.times { SignatureRemindersJob.perform_now } }
    expect(@revision.reload.next_reminder_at).to be_nil
    expect(@revision.signature_operations.where(kind: "remind")).not_to exist
    expect(@record.audits.where(action: "automatic_reminders_stopped").count).to eq(1)
  end
end

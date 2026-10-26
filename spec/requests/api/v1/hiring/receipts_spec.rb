# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring email receipts", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Applications", source_email: "hello@example.test") }
  let(:source) do
    Mail.new do
      from "Internal Forwarder <internal@example.test>"
      to "hello@example.test"
      message_id "receipt-42@example.test"
      subject "Fwd: Application for Rails developer"
      text_part { body "Private forwarded application." }
      attachments["resume.html"] = "<script>alert('untrusted')</script>Private resume"
    end.encoded
  end
  let(:receipt) do
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    Hiring::EmailIntake.new(record).process
    record.reload
  end
  let(:review_attributes) do
    { company_id: company.id, lock_version: receipt.lock_version,
      full_name: "Jaya Rao", email: "jaya@example.test", acknowledge: false }
  end

  before do
    admin.add_role(:admin, company)
    sign_in admin
  end

  it "accepts an authorized pending reprocess request and rejects resolved or stale receipts" do
    pending = Hiring::ReceiveEmail.new(mailbox:, source:).process.reload
    post "/api/v1/hiring/receipts/#{pending.id}/reprocess",
      params: { hiring_receipt: { company_id: company.id, lock_version: pending.lock_version } }, as: :json
    expect(response).to have_http_status(:accepted)
    expect(response.parsed_body.dig("receipt", "state")).to eq("pending")
    expect(pending.audits.find_by!(action: "intake_retry_requested").user_id).to eq(admin.id)

    Hiring::EmailIntake.new(pending).process
    post "/api/v1/hiring/receipts/#{pending.id}/reprocess",
      params: { hiring_receipt: { company_id: company.id, lock_version: pending.reload.lock_version } }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "queues an existing accepted receipt only after confirming its current approved message and recipient" do
    post "/api/v1/hiring/receipts/#{receipt.id}/accept", params: { hiring_receipt: review_attributes }, as: :json
    expect(response).to have_http_status(:ok)
    config = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 3)
    setting = config.save_draft!(details:, lock_version: nil)
    config.approve!(lock_version: setting.lock_version)
    attributes = { company_id: company.id, lock_version: receipt.reload.lock_version,
      approved_setting_version: setting.reload.lock_version, recipient: "jaya@example.test" }
    path = "/api/v1/hiring/receipts/#{receipt.id}/acknowledgement"
    post path, params: { hiring_message: attributes.merge(recipient: "internal@example.test") }, as: :json
    expect(response).to have_http_status(:conflict)
    2.times do
      post path, params: { hiring_message: attributes }, as: :json
      expect(response).to have_http_status(:accepted)
    end
    expect(response.parsed_body.fetch("messages").sole).to include("state" => "queued", "content" => hash_including("to" => "jaya@example.test"))
    expect(HiringMessage.count).to eq(1)
    expect(ActionMailer::Base.deliveries).to be_empty

    first = company.hiring_messages.sole
    original_content = first.content
    first.update!(state: "failed", error_code: "transport_rejected")
    attempt_path = "/api/v1/hiring/receipts/#{receipt.id}/messages/#{first.id}/retry"
    post attempt_path, params: { hiring_message: attributes.merge(message_lock_version: first.lock_version) }, as: :json
    expect(response).to have_http_status(:accepted)
    attempts = response.parsed_body.fetch("messages")
    expect(attempts.map { |item| item.fetch("attempt_number") }).to eq([1, 2])
    expect(attempts.first.fetch("content")).to eq(original_content.slice("to", "reply_to", "subject", "body"))
    expect(attempts.last).to include("original_message_id" => first.id, "queued_by" => hash_including("id" => admin.id))
    expect(HiringMessage.operations.count).to eq(1)
    second = company.hiring_messages.order(:id).last
    second.update!(state: "uncertain", error_code: "transport_unknown")
    post "/api/v1/hiring/receipts/#{receipt.id}/messages/#{second.id}/reconcile", params: { hiring_message: {
      company_id: company.id, lock_version: second.lock_version, outcome: "accepted", evidence: "Synthetic provider event 42.", worker_stopped: false } }, as: :json
    expect(response).to have_http_status(:ok)
    reconciled = response.parsed_body.fetch("messages").last
    expect(reconciled).to include("state" => "uncertain", "resolution" => "accepted", "sent_at" => nil)
    expect(reconciled.fetch("events").to_s).not_to include("Synthetic provider event 42.")

    post path, params: { hiring_message: attributes.merge(actor_id: admin.id) }, as: :json
    expect(response).to have_http_status(:bad_request)
    post path, params: { hiring_message: attributes.merge(company_id: create(:company).id) }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "lists receipt history and filters the review queue without exposing blobs or full email text" do
    receipt
    get "/api/v1/hiring/receipts", params: { company_id: company.id, state: "review", mailbox_id: mailbox.id }
    expect(response).to have_http_status(:ok)
    item = response.parsed_body.fetch("receipts").sole
    expect(item).to include("id" => receipt.id, "state" => "review", "subject" => "Fwd: Application for Rails developer")
    expect(item.fetch("mailbox")).to include("name" => "Applications")
    expect(item).not_to have_key("text")
    expect(response.body).not_to include("Private forwarded application", "rails/active_storage", "signed_id", "raw_email")
    get "/api/v1/hiring/receipts", params: { company_id: company.id, state: "accepted" }
    expect(response.parsed_body.fetch("receipts")).to eq([])
    get "/api/v1/hiring/receipts", params: { company_id: company.id, state: ["review"] }
    expect(response).to have_http_status(:bad_request)
  end

  it "shows a protected plain-text preview, original metadata and explicit attachment download identifiers" do
    get "/api/v1/hiring/receipts/#{receipt.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    item = response.parsed_body.fetch("receipt")
    expect(item).to include("text" => "Private forwarded application.", "email" => "internal@example.test")
    expect(item.fetch("attachments").sole).to include("index" => 0, "filename" => "resume.html")
    expect(response.parsed_body.fetch("messages")).to eq([])
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.body).not_to include("rails/active_storage", "signed_id", "blob_id", "<script>")
  end

  it "serves original mail and untrusted attachments only as sandboxed downloads" do
    get "/api/v1/hiring/receipts/#{receipt.id}/source", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq(source)
    expect(response.media_type).to eq("application/octet-stream")
    expect(response.headers["Content-Disposition"]).to include("attachment")
    expect(response.headers["Content-Security-Policy"]).to include("sandbox", "default-src 'none'")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    get "/api/v1/hiring/receipts/#{receipt.id}/attachments/0", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body).to eq("<script>alert('untrusted')</script>Private resume")
    expect(response.media_type).to eq("application/octet-stream")
    expect(response.headers["Content-Disposition"]).to include("attachment")
    expect(response.headers["Content-Security-Policy"]).to include("sandbox")
    get "/api/v1/hiring/receipts/#{receipt.id}/attachments/999", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
  end

  it "accepts or dismisses a versioned review using the authenticated reviewer" do
    post "/api/v1/hiring/receipts/#{receipt.id}/accept", params: { hiring_receipt: review_attributes }, as: :json
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("receipt", "state")).to eq("accepted")
    expect(response.parsed_body.dig("receipt", "application_id")).to eq(receipt.reload.hiring_application_id)
    expect(response.parsed_body.dig("application", "candidate", "full_name")).to eq("Jaya Rao")
    expect(response.parsed_body.dig("receipt", "reviewed_by")).to include("id" => admin.id, "name" => admin.full_name)
    expect(response.parsed_body.fetch("time_zone")).to eq("America/New_York")
    expect(receipt.reviewed_by_id).to eq(admin.id)
    post "/api/v1/hiring/receipts/#{receipt.id}/dismiss",
      params: { hiring_receipt: { company_id: company.id, lock_version: receipt.lock_version - 1 } }, as: :json
    expect(response).to have_http_status(:conflict)
  end

  it "uploads and deduplicates a bounded eml file through the same private intake" do
    Tempfile.create(["application", ".eml"]) do |file|
      file.binmode
      file.write(source)
      file.flush
      2.times do
        upload = Rack::Test::UploadedFile.new(file.path, "message/rfc822")
        post "/api/v1/hiring/receipts", params: { hiring_receipt: { company_id: company.id, mailbox_id: mailbox.id, file: upload } }
        expect(response).to have_http_status(:accepted)
      end
    end
    expect(company.hiring_receipts.count).to eq(1)
    expect(company.hiring_receipts.sole.raw_email.download).to eq(source)
    expect(HiringMessage.count).to eq(0)
  end

  it "removes uploaded source bytes after the admin upload's enclosing transaction rolls back" do
    destination_id = mailbox.id
    storage = ActiveStorage::Blob.service
    keys = []
    allow(storage).to receive(:upload).and_wrap_original do |upload, key, *arguments, **options|
      keys << key
      upload.call(key, *arguments, **options)
    end
    failure = -> { raise Hiring::ReceiveEmail::Unavailable, "Synthetic receipt failure" if hiring_mailbox_id == destination_id }
    HiringReceipt.set_callback(:create, :before, failure)
    Tempfile.create(["application", ".eml"]) do |file|
      file.binmode
      file.write(source)
      file.flush
      upload = Rack::Test::UploadedFile.new(file.path, "message/rfc822")
      post "/api/v1/hiring/receipts", params: { hiring_receipt: { company_id: company.id, mailbox_id: mailbox.id, file: upload } }
    end
    expect(response).to have_http_status(:service_unavailable)
    expect(keys.size).to eq(1)
    expect(keys.any? { |key| storage.exist?(key) }).to be(false)
    expect(ActiveStorage::Blob.where(key: keys)).not_to exist
    expect(ActionMailbox::InboundEmail.count).to eq(0)
    expect(HiringReceipt.count).to eq(0)
  ensure
    HiringReceipt.skip_callback(:create, :before, failure) if failure
  end

  it "rejects malformed uploads and inactive or foreign inboxes without retaining files" do
    Tempfile.create(["application", ".eml"]) do |file|
      file.write("not a valid email")
      file.flush
      upload = Rack::Test::UploadedFile.new(file.path, "message/rfc822")
      post "/api/v1/hiring/receipts", params: { hiring_receipt: { company_id: company.id, mailbox_id: mailbox.id, file: upload } }
      expect(response).to have_http_status(422)
      mailbox.update!(active: false)
      post "/api/v1/hiring/receipts", params: { hiring_receipt: { company_id: company.id, mailbox_id: mailbox.id, file: upload } }
      expect(response).to have_http_status(:not_found)
    end
    expect(HiringReceipt.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(0)
  end

  it "fails closed if retained source storage becomes public" do
    receipt
    allow_any_instance_of(ActiveStorage::Service::DiskService).to receive(:public?).and_return(true)
    get "/api/v1/hiring/receipts/#{receipt.id}/source", params: { company_id: company.id }
    expect(response).to have_http_status(:service_unavailable)
    expect(response.body).not_to include("Private forwarded application")
    get "/api/v1/hiring/receipts/#{receipt.id}/attachments/0", params: { company_id: company.id }
    expect(response).to have_http_status(:service_unavailable)
  end

  it "denies foreign receipts, changed workspaces and non-admin reads or mutations" do
    record = receipt
    other_company = create(:company)
    other_admin = create(:user, current_workspace: other_company)
    create(:employment, company: other_company, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other_company)
    sign_in other_admin
    ["", "/source", "/attachments/0"].each do |suffix|
      get "/api/v1/hiring/receipts/#{record.id}#{suffix}", params: { company_id: other_company.id }
      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to include("Private forwarded", "internal@example.test")
    end
    { reprocess: :hiring_receipt, acknowledgement: :hiring_message, "messages/1/retry" => :hiring_message, "messages/1/reconcile" => :hiring_message }.each do |action, root|
      post "/api/v1/hiring/receipts/#{record.id}/#{action}", params: { root => { company_id: other_company.id, lock_version: record.lock_version } }, as: :json
      expect(response).to have_http_status(:not_found)
    end
    sign_in admin
    get "/api/v1/hiring/receipts/#{record.id}", params: { company_id: other_company.id }
    expect(response).to have_http_status(:conflict)
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    get "/api/v1/hiring/receipts/#{record.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    post "/api/v1/hiring/receipts/#{record.id}/accept", params: { hiring_receipt: review_attributes }, as: :json
    expect(response).to have_http_status(:forbidden)
    { reprocess: :hiring_receipt, acknowledgement: :hiring_message, "messages/1/retry" => :hiring_message, "messages/1/reconcile" => :hiring_message }.each do |action, root|
      post "/api/v1/hiring/receipts/#{record.id}/#{action}", params: { root => { company_id: company.id, lock_version: record.lock_version } }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
    expect(record.reload.state).to eq("review")
  end

  it "rejects oversized uploads before creating a source blob" do
    Tempfile.create(["oversized", ".eml"]) do |file|
      file.truncate(::Hiring::ReceiveEmail::MAX_BYTES + 1)
      upload = Rack::Test::UploadedFile.new(file.path, "message/rfc822")
      post "/api/v1/hiring/receipts", params: { hiring_receipt: { company_id: company.id, mailbox_id: mailbox.id, file: upload } }
      expect(response).to have_http_status(413)
    end
    expect(HiringReceipt.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(0)
  end

  it "protects review decisions against cookie CSRF and unexpected actor fields" do
    post "/api/v1/hiring/receipts/#{receipt.id}/accept",
      params: { hiring_receipt: review_attributes.merge(reviewed_by_id: admin.id) }, as: :json
    expect(response).to have_http_status(:bad_request)
    previous_base = ActionController::Base.allow_forgery_protection
    previous_hiring = Api::V1::Hiring::BaseController.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    Api::V1::Hiring::BaseController.allow_forgery_protection = true
    post "/api/v1/hiring/receipts/#{receipt.id}/dismiss",
      params: { hiring_receipt: { company_id: company.id, lock_version: receipt.lock_version } }, as: :json
    expect(response).to have_http_status(422)
    expect(receipt.reload.state).to eq("review")
  ensure
    ActionController::Base.allow_forgery_protection = previous_base unless previous_base.nil?
    Api::V1::Hiring::BaseController.allow_forgery_protection = previous_hiring unless previous_hiring.nil?
  end
end

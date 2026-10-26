# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private candidate forms", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:details) { HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 4) }
  let(:schema) do
    form = Hiring::Form.default_schema.merge("enabled" => true)
    form.fetch("fields") << { "id" => "custom_private", "label" => "Private clarification", "type" => "textarea",
                             "required" => false, "sensitive" => true }
    form
  end
  let(:configuration) { Hiring::Configure.new(company:, actor: admin) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => "Verified Applicant", "email" => "verified@example.test", "notes" => "Internal screening feedback" }).process
  end
  let(:answers) do
    { "full_name" => "Submitted Applicant", "email" => "submitted@example.test", "time_zone" => "Asia/Kolkata",
      "employment_status" => "Not currently employed", "current_compensation" => nil,
      "expected_compensation" => { "amount" => "120000.50", "currency" => "INR", "period" => "monthly" },
      "custom_private" => "Private candidate explanation", "work_samples" => ["https://github.com/example/project"] }
  end

  around do |example|
    previous = Rails.application.env_config["action_dispatch.show_exceptions"]
    Rails.application.env_config["action_dispatch.show_exceptions"] = :all
    example.run
  ensure
    Rails.application.env_config["action_dispatch.show_exceptions"] = previous
  end

  before do
    admin.add_role(:admin, company)
    sign_in admin
    @setting = configuration.save_draft!(details:, form: schema, lock_version: nil)
    configuration.approve!(lock_version: @setting.lock_version)
    @setting.reload
  end

  def issue
    post "/api/v1/hiring/applications/#{application.id}/forms", params: {
      hiring_form: { company_id: company.id, lock_version: application.reload.lock_version,
        approved_setting_version: @setting.lock_version }
    }, as: :json
    expect(response).to have_http_status(:created)
    data = response.parsed_body.fetch("form_access")
    expect(URI(data.fetch("url")).query).to be_nil
    @token = URI(data.fetch("url")).fragment
    expect(@token).to match(/\A[1-9A-HJ-NP-Za-km-z]{32}\z/)
    HiringPortalAccess.find(data.fetch("id"))
  end

  def portal(action = "open", **attributes)
    post "/hiring-form/#{action}", params: { hiring_form: { token: @token }.merge(attributes) }, as: :json
  end

  it "issues an approved application-scoped form and exposes only candidate metadata through a private exchange" do
    clear_enqueued_jobs
    access = issue
    expect(access.hiring_application_id).to eq(application.id)
    raw = HiringPortalAccess.connection.select_value("SELECT access_token FROM hiring_portal_accesses WHERE id = #{access.id.to_i}")
    expect(raw).not_to include(@token)
    sign_out admin
    portal
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("form")
    expect(data.fetch("fields").pluck("id")).to include("resume", "expected_compensation", "custom_private")
    expect(data.fetch("introduction")).to include("Approved company_intro")
    expect(response.body).not_to include("Internal screening feedback", "approved_by", "company_id", "hiring_application_id",
      "created_by", "blob_id", "signed_id", "access_token", admin.email)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["Referrer-Policy"]).to eq("no-referrer")
    expect(response.headers["X-Frame-Options"]).to eq("DENY")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "uses the same unavailable response for expired, revoked, invalid and closed-application links" do
    access = issue
    sign_out admin
    travel_to(access.expires_at, with_usec: true) { portal }
    expect(response).to have_http_status(:gone)
    unavailable = response.body
    portal(token: "x" * 32)
    expect(response).to have_http_status(:gone)
    expect(response.body).to eq(unavailable)
    application.reload.update!(stage: "withdrawn")
    portal
    expect(response).to have_http_status(:gone)
    application.reload.update!(stage: "received")
    access.update!(revoked_at: Time.current)
    portal
    expect(response).to have_http_status(:gone)
    expect(response.body).to eq(unavailable)
  end

  it "refuses client-supplied application, tenant, blob and internal-feedback identifiers" do
    access = issue
    other = Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id,
      "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
    sign_out admin
    [{ application_id: other.id }, { company_id: create(:company).id }, { blob_id: 1 }, { feedback: "injected" }].each do |attributes|
      portal(**attributes)
      expect(response).to have_http_status(:bad_request)
      expect(response.body).not_to include(other.hiring_candidate.email)
    end
    expect(access.reload.hiring_application_id).to eq(application.id)
  end

  it "stores encrypted answers without changing verified candidate identity or automatically assigning work" do
    access = issue
    sign_out admin
    clear_enqueued_jobs
    portal("submit", answers:, lock_version: 0)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("form", "submitted_at")).to be_present
    submission = access.reload.hiring_submission
    expect(submission.answers).to eq(answers)
    expect(submission.submitted_at).to be_present
    expect(application.reload.stage).to eq("information_pending")
    expect(application.hiring_candidate.reload).to have_attributes(full_name: "Verified Applicant", email: "verified@example.test")
    raw = submission.class.connection.select_value("SELECT answers FROM hiring_submissions WHERE id = #{submission.id.to_i}")
    expect(raw).not_to include("120000.50", "Private candidate explanation", "submitted@example.test")
    expect(submission.audits.pluck(:audited_changes).to_json).not_to include("120000.50", "Private candidate explanation")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(enqueued_jobs).to be_empty
  end

  it "rejects missing required data, malformed compensation and unsupported answer fields" do
    access = issue
    sign_out admin
    invalid = [answers.except("full_name"), answers.merge("email" => ["bad@example.test"]),
      answers.merge("time_zone" => "Mars/Olympus"), answers.merge("unexpected" => "data"),
      answers.merge("expected_compensation" => { "amount" => "120000" }),
      answers.merge("expected_compensation" => { "amount" => "NaN", "currency" => "INR", "period" => "monthly" }),
      answers.merge("expected_compensation" => { "amount" => "-1", "currency" => "INR", "period" => "annual" }),
      answers.merge("expected_compensation" => { "amount" => "120000", "currency" => "INVALID", "period" => "monthly" }),
      answers.merge("expected_compensation" => { "amount" => "120000", "currency" => "INR", "period" => "weekly" }),
      answers.merge("work_samples" => ["javascript:alert(1)"])]
    invalid.each do |values|
      portal("submit", answers: values, lock_version: 0)
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.body).not_to include("120000", "javascript:", "Private candidate explanation")
    end
    expect(access.reload.hiring_submission.submitted_at).to be_nil
    expect(access.hiring_submission.answers).to eq({})
    expect(application.reload.stage).to eq("information_pending")
  end

  it "keeps resume upload and exact-byte downloads private, scoped and required when configured" do
    required = schema.deep_dup
    required.fetch("fields").find { |field| field["id"] == "resume" }["required"] = true
    configuration.save_draft!(details:, form: required, lock_version: @setting.lock_version)
    configuration.approve!(lock_version: @setting.reload.lock_version)
    @setting.reload
    access = issue
    sign_out admin
    portal("submit", answers:, lock_version: 0)
    expect(response).to have_http_status(:unprocessable_content)
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
      file: Rack::Test::UploadedFile.new(source, "application/pdf", original_filename: "Applicant resume.pdf") } }
    expect(response).to have_http_status(:ok)
    form = response.parsed_body.fetch("form")
    expect(form.dig("resume", "filename")).to eq("Applicant resume.pdf")
    expect(response.body).not_to include("blob_id", "signed_id", "rails/active_storage", "storage/")
    expect(access.reload.hiring_submission.resume.blob.service.public?).to be(false)
    portal("resume/download")
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(File.binread(source))
    expect(response.headers["Content-Disposition"]).to include("attachment")
    expect(response.headers["Content-Security-Policy"]).to eq("sandbox; default-src 'none'")
    portal("submit", answers:, lock_version: form.fetch("lock_version"))
    expect(response).to have_http_status(:ok)
    expect(access.reload.hiring_submission.submitted_at).to be_present
    access.update!(revoked_at: Time.current)
    portal("resume/download")
    expect(response).to have_http_status(:gone)
  end

  it "rejects forged files, storage references and oversized resumes without retaining bytes" do
    access = issue
    sign_out admin
    count = ActiveStorage::Blob.count
    post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0", file: "an-existing-signed-blob" } }
    expect(response).to have_http_status(:unprocessable_content)
    Tempfile.create(["candidate", ".pdf"]) do |file|
      file.write("<html>Active content pretending to be a PDF</html>")
      file.flush
      post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
        file: Rack::Test::UploadedFile.new(file.path, "application/pdf") } }
      expect(response).to have_http_status(:unprocessable_content)
      file.rewind
      file.write("%PDF-1.7\n" + "x" * 5.megabytes)
      file.flush
      post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
        file: Rack::Test::UploadedFile.new(file.path, "application/pdf") } }
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(ActiveStorage::Blob.count).to eq(count)
    expect(access.reload.hiring_submission.resume).not_to be_attached
  end

  it "accepts a DOCX resume without fetching, extracting or executing its contents" do
    access = issue
    sign_out admin
    source = Rails.root.join("spec/fixtures/agreements/synthetic-short.docx")
    post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
      file: Rack::Test::UploadedFile.new(source, "application/vnd.openxmlformats-officedocument.wordprocessingml.document") } }
    expect(response).to have_http_status(:ok)
    portal("resume/download")
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(File.binread(source))
    expect(access.reload.hiring_submission.resume.blob.metadata["analyzed"]).to be(true)
  end

  it "rejects stale and submitted resume replacements without changing stored bytes" do
    access = issue
    sign_out admin
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    upload = ->(version) do
      post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: version.to_s,
        file: Rack::Test::UploadedFile.new(source, "application/pdf") } }
    end
    upload.call(0)
    expect(response).to have_http_status(:ok)
    submission = access.reload.hiring_submission
    original = submission.resume.blob
    count = ActiveStorage::Blob.count
    upload.call(0)
    expect(response).to have_http_status(:conflict)
    portal("submit", answers:, lock_version: submission.lock_version)
    expect(response).to have_http_status(:ok)
    upload.call(submission.reload.lock_version)
    expect(response).to have_http_status(:conflict)
    expect(ActiveStorage::Blob.count).to eq(count)
    expect(submission.reload.resume.blob).to eq(original)
    expect(submission.resume_bytes).to eq(File.binread(source))
  end

  it "refuses public storage and detects changed resume bytes on both download paths" do
    access = issue
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    upload = -> do
      post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
        file: Rack::Test::UploadedFile.new(source, "application/pdf") } }
    end
    service = ActiveStorage::Blob.service
    allow(service).to receive(:public?).and_return(true)
    expect { upload.call }.not_to change(ActiveStorage::Blob, :count)
    expect(response).to have_http_status(:service_unavailable)
    expect(access.reload.hiring_submission.resume).not_to be_attached
    allow(service).to receive(:public?).and_call_original
    upload.call
    expect(response).to have_http_status(:ok)
    blob = access.reload.hiring_submission.resume.blob
    original = File.binread(source)
    service.upload(blob.key, StringIO.new(original.sub("PDF", "BAD")))
    portal("resume/download")
    expect(response).to have_http_status(:service_unavailable)
    expect(response.body).not_to include("%BAD")
    get "/api/v1/hiring/applications/#{application.id}/forms/#{access.id}/resume", params: { company_id: company.id }
    expect(response).to have_http_status(:service_unavailable)
    expect(response.body).not_to include("%BAD")
  end

  it "enforces application and workspace links at the database boundary and freezes invitation snapshots" do
    access = issue
    other = create(:company)
    expect do
      HiringPortalAccess.transaction(requires_new: true) { access.update_columns(company_id: other.id) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect do
      HiringSubmission.transaction(requires_new: true) { access.hiring_submission.update_columns(company_id: other.id) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect(access.reload.update(introduction: "Unapproved replacement")).to be(false)
    expect(access.reload.update(form_schema: schema.merge("enabled" => false))).to be(false)
    raw = HiringPortalAccess.connection.select_one(HiringPortalAccess.where(id: access.id).select(:form_schema, :introduction).to_sql)
    expect(raw.values.join).not_to include("custom_private", "Approved company_intro")
    expect(access.inspect).not_to include(@token, "Approved company_intro")
  end

  it "deletes one workspace's forms without purging another workspace's shared resume" do
    access = issue
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
      file: Rack::Test::UploadedFile.new(source, "application/pdf") } }
    expect(response).to have_http_status(:ok)
    blob = access.reload.hiring_submission.resume.blob
    other = create(:company)
    other_admin = create(:user, current_workspace: other)
    create(:employment, company: other, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other)
    other_configuration = Hiring::Configure.new(company: other, actor: other_admin)
    setting = other_configuration.save_draft!(details:, form: schema, lock_version: nil)
    other_configuration.approve!(lock_version: setting.lock_version)
    other_application = Hiring::Intake.new(company: other, actor: other_admin, attributes: { "company_id" => other.id,
      "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }).process
    other_access = Hiring::Form.issue!(application: other_application, setting:)
    other_submission = other_access.hiring_submission
    other_submission.resume.attach(blob)
    company_id = company.id
    company.destroy!
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(HiringPortalAccess.where(company_id:)).not_to exist
    expect(HiringSubmission.where(company_id:)).not_to exist
    expect(other_submission.reload.resume_bytes).to eq(File.binread(source))
    expect(other_access.reload).to be_active
    expect(other_application.reload.company_id).to eq(other.id)
  end

  it "requires the real cookie CSRF token and serves a standalone shell without candidate data" do
    issue
    sign_out admin
    previous = HiringPortalController.allow_forgery_protection
    HiringPortalController.allow_forgery_protection = true
    portal
    expect(response).to have_http_status(:unprocessable_content)
    get "/hiring-form"
    expect(response).to have_http_status(:ok)
    scripts = Nokogiri::HTML(response.body).css('script[type="module"]').pluck("src")
    expect(scripts).to include(a_string_matching(%r{/hiring_form[-.]}))
    expect(scripts).not_to include(a_string_matching(%r{/(?:application|browser)[-.]}))
    expect(response.body).not_to include(@token, "verified@example.test", "Internal screening feedback", "ahoy", "application.ts")
    csrf = Nokogiri::HTML(response.body).at_css('meta[name="csrf-token"]')["content"]
    post "/hiring-form/open", params: { hiring_form: { token: @token } }, as: :json, headers: { "X-CSRF-Token" => csrf }
    expect(response).to have_http_status(:ok)
  ensure
    HiringPortalController.allow_forgery_protection = previous unless previous.nil?
  end

  it "rejects oversized known-length and chunked bodies before parsing candidate data" do
    payload = { hiring_form: { token: "x" * 32, answers: { work_summary: "x" * 130.kilobytes } } }.to_json
    post "/hiring-form/submit", params: payload, headers: { "CONTENT_TYPE" => "application/json" }
    expect(response).to have_http_status(:content_too_large)
    expect(response.headers["Cache-Control"]).to include("no-store")
    env = Rack::MockRequest.env_for("/hiring-form/submit", method: "POST", input: payload, "CONTENT_TYPE" => "application/json")
    env.delete("CONTENT_LENGTH")
    status, headers, body = Rails.application.call(env)
    expect(status).to eq(413)
    expect(headers["cache-control"] || headers["Cache-Control"]).to include("no-store")
    body.close if body.respond_to?(:close)
    expect(HiringSubmission.count).to eq(0)
  end

  it "bounds format-suffixed requests even when their declared content length is understated" do
    bodies = { "/hiring-form/submit.json" => "x" * 130.kilobytes,
               "/hiring-form/resume.json" => "x" * (6.megabytes + 1) }
    bodies.each do |path, payload|
      env = Rack::MockRequest.env_for(path, method: "POST", input: payload, "CONTENT_TYPE" => "application/json")
      env["CONTENT_LENGTH"] = "0"
      status, headers, body = Rails.application.call(env)
      expect(status).to eq(413)
      expect(headers["cache-control"] || headers["Cache-Control"]).to include("no-store")
      body.close if body.respond_to?(:close)
    end
    expect(HiringSubmission.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(0)
  end

  it "keeps submitted responses immutable while allowing an identical retry after a lost response" do
    access = issue
    sign_out admin
    portal("submit", answers:, lock_version: 0)
    expect(response).to have_http_status(:ok)
    expect(HiringAssignment.where(hiring_application_id: access.hiring_application_id)).not_to exist
    original = access.reload.hiring_submission
    timestamp = original.submitted_at
    portal("submit", answers:, lock_version: 0)
    expect(response).to have_http_status(:ok)
    expect(original.reload.submitted_at).to eq(timestamp)
    portal("submit", answers: answers.merge("full_name" => "Rewritten after submission"), lock_version: original.lock_version)
    expect(response).to have_http_status(:conflict)
    expect(original.reload.answers).to eq(answers)
    expect(original.update(answers: answers.merge("custom_private" => "Rewritten directly"))).to be(false)
  end

  it "preserves classifications and excludes originally sensitive, newly sensitive and removed fields by default" do
    form = schema.deep_dup
    %w[custom_public custom_removed].each do |id|
      form.fetch("fields") << { "id" => id, "label" => id.humanize, "type" => "textarea", "required" => false, "sensitive" => false }
    end
    configuration.save_draft!(details:, form:, lock_version: @setting.lock_version)
    configuration.approve!(lock_version: @setting.reload.lock_version)
    @setting.reload
    access = issue
    sign_out admin
    submitted = answers.merge("custom_public" => "Later classified private", "custom_removed" => "Removed from future forms")
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
      file: Rack::Test::UploadedFile.new(source, "application/pdf") } }
    expect(response).to have_http_status(:ok)
    portal("submit", answers: submitted, lock_version: response.parsed_body.dig("form", "lock_version"))
    expect(response).to have_http_status(:ok)
    sign_in admin
    get "/api/v1/hiring/applications/#{application.id}/forms", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("forms").first.fetch("answers")).to eq(submitted)
    expect(response.body).not_to include(@token, "access_token", "blob_id", "signed_id")
    submission = access.reload.hiring_submission
    expect(submission.review_details.fetch(:answers)).to include("custom_public", "custom_removed")
    expect(submission.review_details.fetch(:resume)).to include(filename: "qa-main.pdf")
    changed = form.deep_dup
    changed.fetch("fields").find { |field| field["id"] == "custom_private" }["sensitive"] = false
    changed.fetch("fields").find { |field| field["id"] == "custom_public" }["sensitive"] = true
    changed.fetch("fields").find { |field| field["id"] == "resume" }["sensitive"] = true
    changed.fetch("fields").reject! { |field| field["id"] == "custom_removed" }
    configuration.save_draft!(details:, form: changed, lock_version: @setting.lock_version)
    projection = submission.review_details
    expect(projection.fetch(:answers)).to eq(submitted.except("current_compensation", "expected_compensation", "custom_private", "custom_public", "custom_removed"))
    expect(projection.fetch(:fields).pluck("id")).not_to include("current_compensation", "expected_compensation", "custom_private", "custom_public", "custom_removed")
    expect(projection.fetch(:resume)).to be_nil
    expect(submission.review_details(include_sensitive: true).fetch(:resume)).to include(filename: "qa-main.pdf")
    expect(access.form_schema).to eq(form)
    expect(submission.answers).to eq(submitted)
  end

  it "reissues a form explicitly, advances the application version and revokes prior access" do
    first = issue
    previous_version = application.reload.lock_version
    second = issue
    expect(application.reload.lock_version).to be > previous_version
    expect(first.reload.revoked_at).to be_present
    expect(second.revoked_at).to be_nil
    sign_out admin
    portal(token: first.access_token)
    expect(response).to have_http_status(:gone)
    sign_in admin
    delete "/api/v1/hiring/applications/#{application.id}/forms/#{second.id}", params: {
      hiring_form: { company_id: company.id, lock_version: application.reload.lock_version }
    }, as: :json
    expect(response).to have_http_status(:ok)
    expect(second.reload.revoked_at).to be_present
    sign_out admin
    portal
    expect(response).to have_http_status(:gone)
  end

  it "retains no file bytes when persistence fails after an upload" do
    access = issue
    sign_out admin
    source = Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf")
    original_blobs = ActiveStorage::Blob.pluck(:key)
    keys = []
    allow(ActiveStorage::Blob.service).to receive(:upload).and_wrap_original do |upload, key, *arguments, **options|
      keys << key
      upload.call(key, *arguments, **options)
    end
    failure = -> { raise ActiveRecord::RecordInvalid, self if hiring_portal_access_id == access.id && resume.attached? }
    HiringSubmission.set_callback(:touch, :before, failure)
    post "/hiring-form/resume", params: { hiring_form: { token: @token, lock_version: "0",
      file: Rack::Test::UploadedFile.new(source, "application/pdf") } }
    expect(response).to have_http_status(:unprocessable_content)
    expect(keys.size).to eq(1)
    expect(keys.any? { |key| ActiveStorage::Blob.service.exist?(key) }).to be(false)
    expect(ActiveStorage::Blob.pluck(:key)).to match_array(original_blobs)
    expect(access.reload.hiring_submission.resume).not_to be_attached
  ensure
    HiringSubmission.skip_callback(:touch, :before, failure) if failure
  end

  it "requires approval and rejects stale, foreign or non-administrator form operations" do
    access = issue
    original_version = application.reload.lock_version
    params = { hiring_form: { company_id: company.id, lock_version: original_version - 1,
      approved_setting_version: @setting.lock_version } }
    post "/api/v1/hiring/applications/#{application.id}/forms", params:, as: :json
    expect(response).to have_http_status(:conflict)
    expect(access.reload.revoked_at).to be_nil
    configuration.save_draft!(details: details.merge("client_count" => 5), lock_version: @setting.lock_version)
    params[:hiring_form].merge!(lock_version: original_version, approved_setting_version: @setting.reload.lock_version)
    post "/api/v1/hiring/applications/#{application.id}/forms", params:, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(access.reload.revoked_at).to be_nil
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    get "/api/v1/hiring/applications/#{application.id}/forms", params: { company_id: company.id, include_sensitive: true }
    expect(response).to have_http_status(:forbidden)
    delete "/api/v1/hiring/applications/#{application.id}/forms/#{access.id}", params:, as: :json
    expect(response).to have_http_status(:forbidden)
    other = create(:company)
    admin.update!(current_workspace: other)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    get "/api/v1/hiring/applications/#{application.id}/forms", params: { company_id: other.id }
    expect(response).to have_http_status(:not_found)
    get "/api/v1/hiring/applications/#{application.id}/forms/#{access.id}/resume", params: { company_id: other.id }
    expect(response).to have_http_status(:not_found)
    expect(access.reload.revoked_at).to be_nil
  end

  it "returns the current active link and application state while paginating older form history" do
    last = nil
    21.times { last = issue }
    get "/api/v1/hiring/applications/#{application.id}/forms", params: { company_id: company.id, page: 2 }
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data.fetch("forms").size).to eq(1)
    expect(data["active_access_id"]).to eq(last.id)
    expect(data["application_stage"]).to eq("information_pending")
    expect(data.fetch("application_lock_version")).to eq(application.reload.lock_version)
    expect(data.fetch("forms").first.fetch("access_id")).not_to eq(last.id)
    expect(data.fetch("pagination")).to include("page" => 2, "has_more" => false)
  end
end

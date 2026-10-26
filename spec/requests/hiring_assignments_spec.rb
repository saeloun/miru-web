# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring assessment HTTP boundaries", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:admin_membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:reviewer) { create(:user, current_workspace: company) }
  let!(:reviewer_membership) { create(:employment, company:, user: reviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name,
      "email" => Faker::Internet.unique.email, "notes" => "Private administrative notes"
    }).process
  end
  let(:template) do
    saved = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Catalogue exercise", "details" => {
        "instructions" => "Build a catalogue", "criteria" => "Explain tests and tradeoffs", "expected_minutes" => 90,
        "submission_method" => "repository_or_files", "ai_policy" => "Disclose tools and your contribution"
      }
    }).process
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => saved.lock_version
    }).process(template: saved, action: "approve")
  end
  let(:issue_attributes) do
    { company_id: company.id, application_version: application.reload.lock_version, template_id: template.id,
      template_version: template.lock_version, reviewer_employment_id: reviewer_membership.id,
      due_at: 2.days.from_now.iso8601, request_key: SecureRandom.uuid, candidate_note: "Describe your tradeoffs" }
  end
  let(:answers) do
    { repository_url: "https://example.test/work", setup: "Run bin/setup", approach: "Used request tests",
      own_contribution: "I wrote and can explain this implementation", ai_used: false }
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
    reviewer.add_role(:employee, company)
    sign_in admin
  end

  def issue
    post "/api/v1/hiring/applications/#{application.id}/assignments", params: { hiring_assignment: issue_attributes }, as: :json
    expect(response).to have_http_status(:created)
    data = response.parsed_body.fetch("assignment")
    @token = URI(data.fetch("url")).fragment
    expect(URI(data.fetch("url")).query).to be_nil
    HiringAssignment.find(data.fetch("id"))
  end

  def portal(action = "open", **attributes)
    post "/hiring-assignment/#{action}", params: { hiring_assessment: { token: @token }.merge(attributes) }, as: :json
  end

  def submit(assignment)
    portal("submit", assignment_version: assignment.reload.lock_version,
      submission_version: assignment.submission.reload.lock_version, answers:)
    expect(response).to have_http_status(:ok)
  end

  it "issues only explicit approved work, retries safely and exchanges a fragment token for candidate-only metadata" do
    expect { @assignment = issue }.not_to change(HiringMessage, :count)
    post "/api/v1/hiring/applications/#{application.id}/assignments", params: { hiring_assignment: issue_attributes }, as: :json
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("assignment").fetch("id")).to eq(@assignment.id)
    expect(HiringAssignment.count).to eq(1)
    sign_out admin
    portal
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("assignment").fetch("title")).to eq("Catalogue exercise")
    expect(response.body).not_to include(admin.email, reviewer.email, "Private administrative notes", "reviewer", "events",
      "access_token", "company_id", "hiring_application_id", "request_key")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["Referrer-Policy"]).to eq("no-referrer")
  end

  it "rejects malformed, stale and expired candidate requests and preserves an explicit false disclosure" do
    assignment = issue
    sign_out admin
    portal("submit", assignment_version: 999, submission_version: 0, answers:)
    expect(response).to have_http_status(:conflict)
    portal("submit", assignment_version: assignment.lock_version, submission_version: 0, answers: answers.except(:ai_used))
    expect(response).to have_http_status(:unprocessable_content)
    submit(assignment)
    expect(response.parsed_body.dig("assignment", "submission", "answers", "ai_used")).to be(false)
    submit(assignment)
    portal("open", reviewer_employment_id: reviewer_membership.id)
    expect(response).to have_http_status(:bad_request)
    travel_to(assignment.due_at + 1.second) do
      portal
      expect(response).to have_http_status(:gone)
    end
    portal(token: "x" * 32)
    expect(response).to have_http_status(:gone)
  end

  it "keeps reviewers out of admin APIs and limits assessment access to the current designated active staff member" do
    assignment = issue
    sign_out admin
    submit(assignment)
    sign_in reviewer
    get "/api/v1/hiring/assignment_reviews", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("assignments").pluck("id")).to eq([assignment.id])
    get "/api/v1/hiring/applications/#{application.id}/assignments", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/hiring/assignment_reviews/#{assignment.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include("Private administrative notes", "access_token", "events", admin.email)
    attributes = { company_id: company.id, application_version: application.reload.lock_version,
      assignment_version: assignment.reload.lock_version, submission_id: assignment.submission.id,
      outcome: "clarification_required", request_kind: "walkthrough", notes: "Please explain the query design",
      dimensions: HiringAssignmentReview::DIMENSIONS.index_with { "Discussed in the submitted explanation" } }
    post "/api/v1/hiring/assignment_reviews/#{assignment.id}/reviews", params: { hiring_assignment: attributes }, as: :json
    expect(response).to have_http_status(:ok)
    expect(assignment.reload.current_review.outcome).to eq("clarification_required")
    expect(application.reload.stage).to eq("assignment_review")
    reviewer_membership.update!(resigned_at: Date.yesterday)
    get "/api/v1/hiring/assignment_reviews/#{assignment.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    sign_out reviewer
    sign_in admin
    get "/api/v1/hiring/assignment_reviews/#{assignment.id}", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it "denies foreign application IDs and fails stale admin decisions without advancing the candidate" do
    assignment = issue
    foreign = create(:company)
    attributes = issue_attributes.merge(company_id: foreign.id, request_key: SecureRandom.uuid)
    post "/api/v1/hiring/applications/#{application.id}/assignments", params: { hiring_assignment: attributes }, as: :json
    expect(response).to have_http_status(:conflict)
    get "/api/v1/hiring/applications/999999999/assignments", params: { company_id: company.id }
    expect(response).to have_http_status(:not_found)
    post "/api/v1/hiring/applications/#{application.id}/assignments/#{assignment.id}/decision", params: {
      hiring_assignment: { company_id: company.id, application_version: 999, assignment_version: assignment.lock_version,
        action: "advance", reason: "Explicit admin decision", review_id: nil }
    }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(application.reload.stage).to eq("assignment_assigned")
  end

  it "transfers bounded opaque files privately and revokes reviewer downloads after an admin decision" do
    assignment = issue
    sign_out admin
    Tempfile.create(["assessment-http", ".rb"]) do |file|
      file.write("raise 'this upload must never be executed'")
      file.flush
      upload = Rack::Test::UploadedFile.new(file.path, "text/x-ruby")
      post "/hiring-assignment/files", params: { hiring_assessment: {
        token: @token, assignment_version: assignment.lock_version.to_s,
        submission_version: assignment.submission.lock_version.to_s, file: upload
      } }
      expect(response).to have_http_status(:ok)
      metadata = response.parsed_body.dig("assignment", "submission", "files").sole
      expect(response.body).not_to include("blob_id", "signed_id", "hiring_sha256")
      portal("files/download", attachment_id: metadata.fetch("id"))
      expect(response).to have_http_status(:ok)
      expect(response.body).to eq(File.read(file.path))
      expect(response.media_type).to eq("application/octet-stream")
      expect(response.headers["Content-Disposition"]).to start_with("attachment;")
      expect(response.headers["Content-Security-Policy"]).to include("sandbox")
      portal("files/download", attachment_id: 999999999)
      expect(response).to have_http_status(:not_found)
      submit(assignment)
      sign_in reviewer
      get "/api/v1/hiring/assignment_reviews/#{assignment.id}/files/#{metadata.fetch('id')}", params: { company_id: company.id }
      expect(response).to have_http_status(:ok)
      expect(response.body).to eq(File.read(file.path))
      sign_out reviewer
      sign_in admin
      post "/api/v1/hiring/applications/#{application.id}/assignments/#{assignment.id}/decision", params: {
        hiring_assignment: { company_id: company.id, application_version: application.reload.lock_version,
          assignment_version: assignment.reload.lock_version, action: "cancel", reason: "Assessment no longer required", review_id: nil }
      }, as: :json
      expect(response).to have_http_status(:ok)
      get "/api/v1/hiring/applications/#{application.id}/assignments/#{assignment.id}/files/#{metadata.fetch('id')}", params: { company_id: company.id }
      expect(response).to have_http_status(:ok)
      sign_out admin
      sign_in reviewer
      get "/api/v1/hiring/assignment_reviews/#{assignment.id}/files/#{metadata.fetch('id')}", params: { company_id: company.id }
      expect(response).to have_http_status(:forbidden)
      sign_out reviewer
      portal("files/download", attachment_id: metadata.fetch("id"))
      expect(response).to have_http_status(:gone)
    end
  end

  it "requires a real page CSRF token and serves an isolated shell without private metadata" do
    issue
    sign_out admin
    previous = HiringAssignmentPortalController.allow_forgery_protection
    HiringAssignmentPortalController.allow_forgery_protection = true
    portal
    expect(response).to have_http_status(:unprocessable_content)
    get "/hiring-assignment"
    expect(response).to have_http_status(:ok)
    document = Nokogiri::HTML(response.body)
    expect(document.css('script[type="module"]').pluck("src")).to include(a_string_matching(%r{/hiring_assignment[-.]}))
    expect(response.body).not_to include(@token, "Private administrative notes", "ahoy", "application.ts")
    csrf = document.at_css('meta[name="csrf-token"]')["content"]
    post "/hiring-assignment/open", params: { hiring_assessment: { token: @token } }, as: :json, headers: { "X-CSRF-Token" => csrf }
    expect(response).to have_http_status(:ok)
  ensure
    HiringAssignmentPortalController.allow_forgery_protection = previous unless previous.nil?
  end

  it "retains a completed private upload when the link expires before the response can be rendered" do
    assignment = issue
    sign_out admin
    allow_any_instance_of(Hiring::Assignments).to receive(:upload!).and_wrap_original do |original, **arguments|
      result = original.call(**arguments)
      travel_to(assignment.due_at + 1.second)
      result
    end
    Tempfile.create(["assessment-deadline", ".txt"]) do |file|
      file.write("Synthetic accepted work")
      file.flush
      post "/hiring-assignment/files", params: { hiring_assessment: {
        token: @token, assignment_version: assignment.lock_version.to_s,
        submission_version: assignment.submission.lock_version.to_s, file: Rack::Test::UploadedFile.new(file.path)
      } }
      expect(response).to have_http_status(:gone)
      stored = assignment.reload.submission.files.sole
      expect(assignment.submission.file_bytes(stored)).to eq("Synthetic accepted work")
    end
  ensure
    travel_back
  end

  it "bounds actual request bytes before parsing, including format suffixes and false content lengths" do
    { "/hiring-assignment/submit.json" => 130.kilobytes,
      "/hiring-assignment/files.json" => 6.megabytes + 1,
      "/hiring-assignment/files/remove" => 130.kilobytes }.each do |path, length|
      env = Rack::MockRequest.env_for(path, method: "POST", input: "x" * length, "CONTENT_TYPE" => "application/json")
      env["CONTENT_LENGTH"] = "0"
      status, headers, body = Rails.application.call(env)
      expect(status).to eq(413)
      expect(headers["cache-control"] || headers["Cache-Control"]).to include("no-store")
      body.close if body.respond_to?(:close)
    end
    expect(HiringAssignmentSubmission.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(0)
  end

  it "redacts the actual portal and reviewer controller trace parameters" do
    assignment = issue
    sign_out admin
    transaction = Sentry::Transaction.new(name: "Assessment trace privacy", sampled: true, hub: Sentry.get_current_hub)
    span = Sentry::Span.new(transaction:, op: "view.process_action.action_controller", description: "HiringAssignmentPortalController#submit")
    allow(Sentry).to receive(:with_child_span).and_wrap_original do |original, **attributes, &block|
      attributes[:description] == span.description ? block.call(span) : original.call(**attributes, &block)
    end
    submit(assignment)
    expect(span.to_hash.dig(:data, :params)).to be_present
    event = Sentry::TransactionEvent.new(transaction:, configuration: Sentry.configuration)
    event.spans = [span.to_hash, { description: "Api::V1::Hiring::AssignmentReviewsController#create",
      data: { params: { "hiring_assignment" => { notes: "Private reviewer feedback" } } } }]
    event = Sentry.configuration.before_send_transaction.call(event, {})
    expect(event.spans.first.dig(:data, :params, "hiring_assessment")).to eq("[FILTERED]")
    expect(event.spans.last.dig(:data, :params, "hiring_assignment")).to eq("[FILTERED]")
    expect(event.spans.to_json).not_to include(@token, "Private reviewer feedback", "own_contribution")
  end
end

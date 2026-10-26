# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private hiring assessments" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:admin_membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:reviewer) { create(:user, current_workspace: company) }
  let!(:reviewer_membership) { create(:employment, company:, user: reviewer, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name,
      "email" => Faker::Internet.unique.email
    }).process
  end
  let(:template) do
    saved = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Catalogue assessment", "details" => {
        "instructions" => "Build a searchable catalogue", "criteria" => "Explain your tests and tradeoffs",
        "expected_minutes" => 90, "submission_method" => "repository_or_files", "ai_policy" => "Disclose tool use and your contribution"
      }
    }).process
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => saved.lock_version
    }).process(template: saved, action: "approve")
  end
  let(:issue_attributes) do
    { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "template_id" => template.id, "template_version" => template.lock_version,
      "reviewer_employment_id" => reviewer_membership.id, "due_at" => 2.days.from_now.iso8601,
      "request_key" => SecureRandom.uuid }
  end
  let(:answers) do
    { "repository_url" => "https://example.test/repository", "setup" => "Run bundle install and bin/setup",
      "approach" => "Used indexed queries and request tests", "own_contribution" => "I wrote and understand the catalogue and its tests",
      "ai_used" => false }
  end

  before do
    admin.add_role(:admin, company)
    reviewer.add_role(:employee, company)
  end

  def service(actor = admin)
    Hiring::Assignments.new(application:, actor:)
  end

  def issue(**values)
    service.issue!(attributes: issue_attributes.merge(values.stringify_keys))
  end

  def submit(assignment, values = answers)
    service(nil).submit!(assignment:, token: assignment.access_token, attributes: {
      "assignment_version" => assignment.reload.lock_version,
      "submission_version" => assignment.submission.reload.lock_version, "answers" => values
    })
  end

  def upload(assignment, name: "work.zip", data: "raise 'untrusted code must never run'")
    Tempfile.create(["assessment", ".bin"]) do |file|
      file.binmode
      file.write(data)
      file.flush
      value = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: name, type: "application/octet-stream")
      service(nil).upload!(assignment:, token: assignment.access_token, attributes: {
        "assignment_version" => assignment.reload.lock_version, "submission_version" => assignment.submission.reload.lock_version, "file" => value
      })
    end
  end

  def review(assignment, actor: reviewer, **values)
    service(actor).review!(assignment:, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "assignment_version" => assignment.reload.lock_version, "submission_id" => assignment.submission.id,
      "outcome" => "pass", "request_kind" => "none",
      "dimensions" => %w[correctness code_quality testing maintainability problem_solving understanding].index_with { "Evidence from the submitted work" }
    }.merge(values.stringify_keys))
  end

  def decide(assignment, action, **values)
    service.decide!(assignment:, attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "assignment_version" => assignment.reload.lock_version, "action" => action, "reason" => "Reviewed the recorded evidence",
      "review_id" => assignment.current_review&.id
    }.merge(values.stringify_keys))
  end

  it "freezes the explicitly approved task and deadline without sending mail or creating duplicate work" do
    expect { issue }.not_to change(HiringMessage, :count)
    assignment = company.hiring_assignments.sole
    expect(application.reload.stage).to eq("assignment_assigned")
    expect(assignment.terms.dig("details", "expected_minutes")).to eq(90)
    expect(assignment.submission.answers).to eq({})
    expect(issue.id).to eq(assignment.id)
    expect(assignment.events.pluck(:action)).to eq(["issued"])
    expect { issue(request_key: SecureRandom.uuid, application_version: application.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => template.lock_version, "details" => template.details.merge("expected_minutes" => 45)
    }).process(template:)
    expect(assignment.reload.terms.dig("details", "expected_minutes")).to eq(90)
    expect(assignment.update(due_at: 5.days.from_now)).to be(false)
    expect(assignment.attributes_before_type_cast.fetch("terms")).not_to include("Build a searchable")
  end

  it "rejects stale terms, invalid reviewers, missing time zones and ended admin access" do
    values = issue_attributes
    expect { issue(template_version: values.fetch("template_version") - 1) }.to raise_error(Hiring::Intake::Conflict)
    expect { issue(application_version: values.fetch("application_version") + 1) }.to raise_error(Hiring::Intake::Conflict)
    expect { issue(due_at: "2026-12-01T12:00:00") }.to raise_error(Hiring::Intake::InvalidInput)
    expect { issue(due_at: 1.minute.ago.iso8601) }.to raise_error(Hiring::Intake::InvalidInput)
    other = create(:employment, company: create(:company))
    expect { issue(reviewer_employment_id: other.id) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { issue(reviewer_employment_id: "#{reviewer_membership.id}junk") }.to raise_error(Hiring::Intake::InvalidInput)
    admin_membership.update!(resigned_at: Date.yesterday)
    expect { issue }.to raise_error(Pundit::NotAuthorizedError)
    expect(HiringAssignment.count).to eq(0)
  end

  it "requires own-contribution and explicit AI disclosure while preserving an honest false answer" do
    assignment = issue
    expect { submit(assignment, answers.except("ai_used")) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { submit(assignment, answers.except("own_contribution")) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { submit(assignment, answers.merge("ai_used" => true)) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { submit(assignment, answers.merge("repository_url" => "javascript:alert(1)")) }.to raise_error(Hiring::Intake::InvalidInput)
    submission = submit(assignment)
    expect(submission.reload.answers.fetch("ai_used")).to be(false)
    expect(application.reload.stage).to eq("assignment_review")
    expect(submit(assignment).id).to eq(submission.id)
    expect { submit(assignment, answers.merge("approach" => "Rewrite after submission")) }.to raise_error(Hiring::Intake::Conflict)
    expect(submission.update(answers: {})).to be(false)
    expect(assignment.events.order(:id).pluck(:action)).to eq(%w[issued submitted])
  end

  it "records all six review dimensions and requires only the designated active reviewer" do
    assignment = issue
    submit(assignment, answers.merge("ai_used" => true, "ai_tools" => "Local assistant", "ai_how" => "Suggested edge cases", "ai_parts" => "Tests only"))
    outsider = create(:user, current_workspace: company)
    outsider.add_role(:employee, company)
    create(:employment, company:, user: outsider, resigned_at: nil)
    expect(HiringAssignmentPolicy.new(outsider, assignment).review?).to be(false)
    expect(HiringAssignmentPolicy.new(admin, assignment).review?).to be(false)
    expect { review(assignment, actor: outsider) }.to raise_error(Pundit::NotAuthorizedError)
    expect { review(assignment, actor: admin) }.to raise_error(Pundit::NotAuthorizedError)
    expect { review(assignment, dimensions: { "correctness" => "Only one dimension" }) }.to raise_error(Hiring::Intake::InvalidInput)
    record = review(assignment)
    expect(record.outcome).to eq("pass")
    expect(record.details.fetch("dimensions").size).to eq(6)
    expect(record.update(outcome: "fail")).to be(false)
    reviewer_membership.update!(resigned_at: Date.yesterday)
    expect { review(assignment) }.to raise_error(Pundit::NotAuthorizedError)
  end

  it "preserves clarification and revised work while revoking the old candidate and reviewer access" do
    assignment = issue
    submit(assignment)
    record = review(assignment, outcome: "clarification_required", request_kind: "walkthrough", notes: "Explain the query and its failure handling")
    expect do
      decide(assignment, "revise", **issue_attributes.merge("request_key" => SecureRandom.uuid,
        "application_version" => application.reload.lock_version, "candidate_note" => "Clarify the query", "due_at" => 1.minute.ago.iso8601))
    end.to raise_error(Hiring::Intake::InvalidInput)
    expect(assignment.reload.ended_at).to be_nil
    replacement = decide(assignment, "revise", **issue_attributes.merge(
      "request_key" => SecureRandom.uuid, "application_version" => application.reload.lock_version,
      "candidate_note" => "Please clarify the query and include a walkthrough", "review_id" => record.id))
    expect(replacement.previous_assignment_id).to eq(assignment.id)
    expect(assignment.reload.status).to eq("superseded")
    expect(assignment.candidate_access?(assignment.access_token)).to be(false)
    expect(HiringAssignmentPolicy.new(reviewer, assignment).review?).to be(false)
    expect(replacement.candidate_access?(replacement.access_token)).to be(true)
    expect(assignment.submission.answers).to eq(answers)
    expect(assignment.reviews.sole.details.fetch("notes")).to eq("Explain the query and its failure handling")
  end

  it "keeps reviewer reassignment history and does not reuse the former review as a new review" do
    assignment = issue
    submit(assignment)
    old_review = review(assignment)
    alternate = create(:user, current_workspace: company)
    alternate.add_role(:employee, company)
    membership = create(:employment, company:, user: alternate, resigned_at: nil)
    service.reassign!(assignment:, attributes: { "company_id" => company.id,
      "application_version" => application.reload.lock_version, "assignment_version" => assignment.reload.lock_version,
      "reviewer_employment_id" => membership.id, "reason" => "Cover an unavailable reviewer" })
    expect(HiringAssignmentPolicy.new(reviewer, assignment).review?).to be(false)
    expect(HiringAssignmentPolicy.new(alternate, assignment).review?).to be(true)
    expect(assignment.current_review).to be_nil
    expect(assignment.reviews.sole.id).to eq(old_review.id)
    expect { decide(assignment, "advance") }.to raise_error(Hiring::Intake::InvalidInput)
    new_review = review(assignment, actor: alternate)
    expect(assignment.current_review.id).to eq(new_review.id)
    expect(assignment.reviews.count).to eq(2)
  end

  it "advances or prepares rejection only through an explicit admin decision without candidate mail" do
    assignment = issue
    submit(assignment)
    review(assignment)
    decide(assignment, "advance")
    expect(application.reload.stage).to eq("interview")
    expect(assignment.reload.status).to eq("completed")
    expect(HiringAssignmentPolicy.new(reviewer, assignment).review?).to be(false)
    another = issue(request_key: SecureRandom.uuid, application_version: application.lock_version)
    submit(another)
    review(another, outcome: "fail")
    decide(another, "reject")
    expect(application.reload.stage).to eq("rejection_pending")
    expect(HiringMessage.count).to eq(0)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "stops expired or replaced capabilities and closes assessment access when screening moves on" do
    assignment = issue
    expect(assignment.candidate_access?("not-a-token")).to be(false)
    travel_to(assignment.due_at + 1.second) do
      expect { submit(assignment) }.to raise_error(HiringAssignment::Unavailable)
    end
    Hiring::Screening.new(application:, actor: admin, attributes: { "company_id" => company.id,
      "lock_version" => application.reload.lock_version, "action" => "interview" }).process
    expect(assignment.reload.ended_at).to be_present
    expect(assignment.candidate_access?(assignment.access_token)).to be(false)
    expect(HiringAssignmentPolicy.new(reviewer, assignment).review?).to be(false)
  end

  it "stores bounded opaque files without executing or analyzing them, verifies bytes and fixes submitted attachments" do
    assignment = issue
    work = upload(assignment)
    attachment = work.files.sole
    expect(attachment.blob.content_type).to eq("application/octet-stream")
    expect(attachment.blob.analyzed?).to be(true)
    expect(work.file_bytes(attachment)).to eq("raise 'untrusted code must never run'")
    expect(enqueued_jobs.none? { |job| job[:job] == ActiveStorage::AnalyzeJob }).to be(true)
    service(nil).remove_file!(assignment:, token: assignment.access_token, attributes: {
      "assignment_version" => assignment.lock_version, "submission_version" => work.reload.lock_version, "attachment_id" => attachment.id
    })
    expect(work.reload.files).not_to be_attached
    upload(assignment, name: "changed.rb")
    submit(assignment, answers.except("repository_url"))
    expect { upload(assignment) }.to raise_error(Hiring::Intake::Conflict)
    file = assignment.submission.files.sole
    expect(service(reviewer).reviewer_file!(assignment:, attachment_id: file.id)).to include(data: "raise 'untrusted code must never run'")
    decide(assignment, "cancel")
    expect { service(reviewer).reviewer_file!(assignment:, attachment_id: file.id) }.to raise_error(Pundit::NotAuthorizedError)
    expect(service.admin_file!(assignment:, attachment_id: file.id)).to include(filename: "changed.rb")
  end

  it "refuses public storage, oversized files and uploads which cross the deadline without orphaning blobs" do
    assignment = issue
    original_blobs = ActiveStorage::Blob.count
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    expect { upload(assignment) }.to raise_error(HiringSubmission::StorageUnavailable)
    expect(ActiveStorage::Blob.count).to eq(original_blobs)
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(false)
    expect { upload(assignment, data: "x" * (5.megabytes + 1)) }.to raise_error(Hiring::Intake::InvalidInput)
    uploaded_keys = []
    allow(ActiveStorage::Blob.service).to receive(:upload).and_wrap_original do |original, *arguments, **options|
      uploaded_keys << arguments.first
      original.call(*arguments, **options)
      travel_to(assignment.due_at + 1.second)
    end
    expect { upload(assignment) }.to raise_error(HiringAssignment::Unavailable)
    expect(ActiveStorage::Blob.count).to eq(original_blobs)
    expect(assignment.submission.files).not_to be_attached
    expect(ActiveStorage::Blob.service.exist?(uploaded_keys.sole)).to be(false)
  ensure
    travel_back
  end

  it "enforces the tenant foreign key and removes assessment dependents in safe workspace-teardown order" do
    assignment = issue
    upload(assignment)
    submit(assignment)
    review(assignment)
    other = create(:company)
    expect do
      HiringAssignment.transaction(requires_new: true) { assignment.update_columns(company_id: other.id) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect(assignment.reload.company_id).to eq(company.id)
    company_id = company.id
    company.destroy!
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    [HiringAssignment, HiringAssignmentSubmission, HiringAssignmentReview, HiringAssignmentEvent].each do |model|
      expect(model.where(company_id:)).not_to exist
    end
    expect(other.reload).to be_persisted
  end
end

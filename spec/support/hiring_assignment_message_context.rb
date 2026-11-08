# frozen_string_literal: true

RSpec.shared_context "assignment message records" do
  include_context "interview message records"

  let(:assignment_template) do
    attributes = { "company_id" => company.id, "title" => "Catalogue assessment", "details" => {
      "instructions" => "Build a searchable catalogue", "criteria" => "Explain your tests and tradeoffs", "expected_minutes" => 90,
      "submission_method" => "repository_or_files", "ai_policy" => "Disclose tool use and your contribution" } }
    record = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes:).process
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: { "company_id" => company.id, "lock_version" => record.lock_version })
      .process(template: record, action: "approve")
  end

  let(:assignment) do
    Hiring::Assignments.new(application:, actor: admin).issue!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "template_id" => assignment_template.id, "template_version" => assignment_template.lock_version,
      "reviewer_employment_id" => staff.id, "due_at" => 2.days.from_now.iso8601, "request_key" => SecureRandom.uuid })
  end

  def approve_assignment_messages(actor: admin)
    setting = approve
    configuration = Hiring::Configure.new(company:, actor:)
    setting = configuration.save_draft!(details: setting.details.merge("assignment_subject" => "Your practical assignment",
      "assignment_body" => "Please review the task and its own-contribution and AI-disclosure requirements."), lock_version: setting.lock_version)
    configuration.approve!(lock_version: setting.lock_version)
  end

  def submit_assignment(record = assignment)
    Hiring::Assignments.new(application:, actor: nil).submit!(assignment: record, token: record.access_token, attributes: {
      "assignment_version" => record.reload.lock_version, "submission_version" => record.submission.reload.lock_version,
      "answers" => { "repository_url" => "https://example.test/repository", "setup" => "Run bin/setup", "approach" => "Small indexed queries",
        "own_contribution" => "I wrote and understand the catalogue and its tests", "ai_used" => false } })
  end
end

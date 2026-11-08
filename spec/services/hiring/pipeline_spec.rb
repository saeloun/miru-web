# frozen_string_literal: true

require "rails_helper"

RSpec.describe Hiring::Pipeline do
  include_context "interview message records"

  def report(**filters)
    described_class.new(company:, actor: admin, filters: { company_id: company.id }.merge(filters), time_zone: Time.find_zone!("Asia/Kolkata")).call
  end

  def intake(**changes)
    Hiring::Intake.new(company:, actor: admin, attributes: { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }.merge(changes.stringify_keys)).process
  end

  def finalize(record, outcome:, reason:, follow_up_on: nil)
    service = Hiring::Decisions.new(application: record, actor: admin)
    decision, = service.create!(attributes: { "company_id" => company.id, "application_version" => record.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => outcome, "reason" => reason,
      "owner_employment_id" => follow_up_on ? membership.id : nil, "follow_up_on" => follow_up_on })
    service.finalize!(decision:, attributes: { "company_id" => company.id,
      "application_version" => record.reload.lock_version, "decision_version" => decision.lock_version })
  end

  def issue_assignment(record, template)
    Hiring::Assignments.new(application: record, actor: admin).issue!(attributes: {
      "company_id" => company.id, "application_version" => record.reload.lock_version,
      "template_id" => template.id, "template_version" => template.lock_version,
      "reviewer_employment_id" => staff.id, "due_at" => 1.day.from_now.iso8601, "request_key" => SecureRandom.uuid })
  end

  it "keeps an empty dataset and missing hire timing distinct from a zero-day hire" do
    expect(report.fetch(:metrics)).to include(total_applications: 0, stage_conversions: [], rejection_reasons: {},
      time_to_hire: { count: 0, average_days: nil, hired_without_timing: 0 })
    expect(report.fetch(:queues).values).to all(eq(0))
    application.update_columns(stage: "hired")
    expect(report.dig(:metrics, :time_to_hire)).to eq(count: 0, average_days: nil, hired_without_timing: 1)
    expect(report.dig(:metrics, :stage_conversions)).to be_empty
  end

  it "uses real recorded transitions, deduplicates repeated rounds and excludes unrelated workspace evidence" do
    first = intake(received_at: 10.days.ago.iso8601)
    second = intake
    first.update!(stage: "interview")
    first.update!(stage: "screening")
    first.update!(stage: "interview")
    first.update!(stage: "hired")
    second.update!(stage: "withdrawn")
    unrelated = create(:company)
    alien = HiringApplication.create!(company: unrelated,
      hiring_candidate: HiringCandidate.create!(company: unrelated, full_name: Faker::Name.name, email: Faker::Internet.unique.email),
      request_key: SecureRandom.uuid, creation_details: { "full_name" => "Other workspace" }, received_at: 20.days.ago)
    alien.update!(stage: "hired")
    metrics = report.fetch(:metrics)
    expect(metrics[:total_applications]).to eq(2)
    expect(metrics[:stage_counts]).to include("hired" => 1, "withdrawn" => 1, "assignment_review" => 0)
    expect(metrics[:stage_conversions]).to include(from: "screening", to: "interview", count: 1, recorded_from_count: 1, percent: 100.0)
    expect(metrics[:stage_conversions]).to include(from: "received", to: "interview", count: 1, recorded_from_count: 2, percent: 50.0)
    expect(metrics[:stage_conversions].count { |edge| edge[:to] == "interview" }).to eq(2)
    expect(metrics[:time_to_hire]).to eq(count: 1, average_days: 10.0, hired_without_timing: 0)
  end

  it "reports finalized rejection reasons and the latest due hold without using draft reasons" do
    rejected = intake
    finalize(rejected, outcome: "reject", reason: "Different role experience")
    held = intake
    finalize(held, outcome: "hold", reason: "Wait for availability", follow_up_on: "2026-11-03")
    future = intake
    finalize(future, outcome: "hold", reason: "Later", follow_up_on: "2026-11-05")
    missing = intake
    missing.update_columns(stage: "rejected")
    expect(report.dig(:metrics, :rejection_reasons)).to eq("Different role experience" => 1)
    expect(report.dig(:metrics, :rejected_without_reason)).to eq(1)
    expect(report.dig(:queues, "hold_follow_ups")).to eq(1)
    expect(report(queue: "hold_follow_ups").fetch(:applications).map(&:id)).to eq([held.id])
    finalize(held, outcome: "additional_round_required", reason: "Continue with another round")
    expect(report.dig(:queues, "hold_follow_ups")).to eq(0)
  end

  it "counts upcoming interviews and missing feedback once per application and excludes cancelled or withdrawn work" do
    booking
    expect(report.dig(:queues, "upcoming_interviews")).to eq(1)
    expect(report.dig(:queues, "missing_feedback")).to eq(0)
    expect(report(interviewer_panel_member_id: panel.id).fetch(:applications).map(&:id)).to eq([application.id])
    expect(report(interviewer_panel_member_id: panel.id + 100_000).fetch(:applications)).to be_empty
    travel_to(Time.utc(2026, 11, 11, 12))
    expect(report.dig(:queues, "upcoming_interviews")).to eq(0)
    expect(report.dig(:queues, "missing_feedback")).to eq(1)
    booking.end!(status: "cancelled", reason: "Rescheduled")
    expect(report.dig(:queues, "missing_feedback")).to eq(0)
    application.update!(stage: "withdrawn")
    expect(report(queue: "missing_feedback").fetch(:applications)).to be_empty
  end

  it "distinguishes a pending submitted review from an overdue unsubmitted assignment and stops closed work" do
    template = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "title" => "Catalogue assessment", "details" => {
        "instructions" => "Build a catalogue", "criteria" => "Explain the tests", "expected_minutes" => 60,
        "submission_method" => "repository_or_files", "ai_policy" => "Disclose tool use" } }).process
    template = Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "lock_version" => template.lock_version }).process(template:, action: "approve")
    pending = issue_assignment(application, template)
    Hiring::Assignments.new(application:, actor: nil).submit!(assignment: pending, token: pending.access_token, attributes: {
      "assignment_version" => pending.reload.lock_version, "submission_version" => pending.submission.lock_version,
      "answers" => { "repository_url" => "https://example.test/work", "setup" => "Run the tests", "approach" => "Indexed queries",
        "own_contribution" => "I wrote the implementation", "ai_used" => false } })
    overdue_application = intake
    overdue = issue_assignment(overdue_application, template)
    travel_to(2.days.from_now)
    expect(report.fetch(:queues)).to include("pending_reviews" => 1, "overdue_assignments" => 1)
    expect(report(queue: "pending_reviews").fetch(:applications).map(&:id)).to eq([application.id])
    expect(report(queue: "overdue_assignments").fetch(:applications).map(&:id)).to eq([overdue_application.id])
    overdue.update!(status: "cancelled", ended_at: Time.current)
    application.update!(stage: "withdrawn")
    expect(report.fetch(:queues)).to include("pending_reviews" => 0, "overdue_assignments" => 0)
  end

  it "applies search, stage, role, owner and company-zone inclusive dates to the same dataset" do
    role = HiringRole.create!(company:, title: "Ruby developer")
    first = intake(full_name: "Selected Candidate", role_id: role.id, owner_employment_id: membership.id,
      received_at: "2026-11-02T19:00:00Z")
    first.update!(stage: "shortlisted")
    intake(received_at: "2026-11-02T17:00:00Z")
    result = report(query: "Selected", role_id: role.id, owner_employment_id: membership.id,
      stage: "shortlisted", from: "2026-11-03", to: "2026-11-03")
    expect(result.fetch(:applications).map(&:id)).to eq([first.id])
    expect(result.dig(:metrics, :total_applications)).to eq(1)
    expect(report(role_id: create(:company).id + 100_000).fetch(:applications)).to be_empty
    expect(report(query: "%").fetch(:applications)).to be_empty
  end

  it "filters the latest submitted experience, preserves missing experience and ignores unsubmitted answers" do
    setting = HiringSetting.create!(company:, details: { "company_intro" => "Synthetic company" })
    add_submission = lambda do |record, value, submitted_at|
      schema = Hiring::Form.default_schema
      access = record.hiring_portal_accesses.create!(company:, hiring_setting: setting, approved_setting_version: 0,
        introduction: "Approved introduction", expires_at: 2.days.from_now, form_schema: schema)
      access.create_hiring_submission!(company:, hiring_application: record, submitted_at:,
        answers: { "full_name" => record.submitted_name, "email" => record.hiring_candidate.email, "total_experience" => value })
    end
    add_submission.call(application, "3.5", 1.day.ago)
    add_submission.call(application, "7", Time.current)
    missing = intake
    add_submission.call(missing, "8", nil)
    expect(report(experience_min: "6", experience_max: "7").fetch(:applications).map(&:id)).to eq([application.id])
    expect(report(experience_max: "4").fetch(:applications)).to be_empty
    expect(report.dig(:metrics, :total_applications)).to eq(2)
  end

  it "paginates applications without truncating totals and orders equal receipt dates by id" do
    records = Array.new(21) { intake }
    first = report
    expect(first.fetch(:applications).map(&:id)).to eq(records.reverse.first(20).map(&:id))
    expect(first.fetch(:pagination)).to eq(page: 1, per_page: 20, has_more: true)
    last = report(page: 2)
    expect(last.fetch(:applications).map(&:id)).to eq([records.first.id])
    expect(last.dig(:metrics, :total_applications)).to eq(21)
    expect(last.dig(:pagination, :has_more)).to be(false)
  end

  it "rejects malformed bounds, structured filters and unauthorized access before exposing data" do
    [{ page: 0 }, { page: 100_000 }, { from: "2026-02-30" }, { from: "2026-11-04", to: "2026-11-03" },
      { experience_min: "-1" }, { experience_min: "5", experience_max: "2" }, { query: [] }, { queue: "everything" },
      { interviewer_panel_member_id: [] }, { unexpected: "value" }].each do |filters|
      expect { report(**filters) }.to raise_error(Hiring::Intake::InvalidInput)
    end
    expect { report(company_id: create(:company).id) }.to raise_error(Hiring::Intake::WorkspaceChanged)
    expect { described_class.new(company:, actor: interviewer, filters: { company_id: company.id }).call }
      .to raise_error(Pundit::NotAuthorizedError)
  end
end

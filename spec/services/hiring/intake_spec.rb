# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring manual intake" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:attributes) do
    { "company_id" => company.id, "request_key" => SecureRandom.uuid,
      "full_name" => Faker::Name.name, "email" => Faker::Internet.unique.email }
  end

  before { admin.add_role(:admin, company) }

  def receive_application(**changes)
    Hiring::Intake.new(company:, actor: admin, attributes: attributes.merge(changes.stringify_keys)).process
  end

  it "keeps one normalized candidate and separate application snapshots without overwriting their profile" do
    first = receive_application(email: "Applicant+rails@example.test")
    second = receive_application(email: " applicant+rails@EXAMPLE.test ",
      request_key: SecureRandom.uuid, full_name: "A different submitted name")

    expect(HiringCandidate.count).to eq(1)
    expect(HiringApplication.count).to eq(2)
    expect(second.hiring_candidate_id).to eq(first.hiring_candidate_id)
    expect(first.hiring_candidate.reload).to have_attributes(email: "applicant+rails@example.test", full_name: attributes["full_name"])
    expect(second).to have_attributes(submitted_name: "A different submitted name", source: "manual", stage: "received")
    expect(first.hiring_candidate.hiring_applications.order(:id)).to eq([first, second])
  end

  it "returns the same application for a retry and rejects changed content using the same key" do
    first = receive_application
    expect(receive_application.id).to eq(first.id)
    expect { receive_application(notes: "Different application") }.to raise_error(Hiring::Intake::Conflict)
    expect(HiringApplication.count).to eq(1)
    expect(HiringCandidate.count).to eq(1)
    expect(first.audits.where(action: "create").count).to eq(1)
  end

  it "keeps candidate identity independent between companies" do
    first = receive_application
    other = create(:company)
    other_admin = create(:user, current_workspace: other)
    create(:employment, company: other, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other)
    second = Hiring::Intake.new(company: other, actor: other_admin,
      attributes: attributes.merge("company_id" => other.id)).process

    expect(first.hiring_candidate_id).not_to eq(second.hiring_candidate_id)
    expect(second).to have_attributes(company_id: other.id)
    expect(HiringCandidate.count).to eq(2)
  end

  it "rejects malformed input and unknown fields before persisting anything" do
    [{ email: ["applicant@example.test"] }, { full_name: { value: "Injected" } }, { full_name: "Bad\u0000name" },
      { email: "first@example.test,second@example.test" }, { request_key: "arbitrary-key" },
      { notes: "x" * 10_001 }, { stage: "hired" }].each do |changes|
      expect { receive_application(**changes) }.to raise_error(Hiring::Intake::InvalidInput)
    end
    expect(HiringApplication.count).to eq(0)
    expect(HiringCandidate.count).to eq(0)
  end

  it "requires an open role and an active staff owner from this company" do
    other = create(:company)
    foreign_role = HiringRole.create!(company: other, title: Faker::Job.title)
    closed_role = HiringRole.create!(company:, title: Faker::Job.title, status: "closed")
    foreign_owner = create(:employment, company: other, resigned_at: nil)
    departed_owner = create(:employment, company:, resigned_at: Date.yesterday)

    [{ role_id: foreign_role.id }, { role_id: closed_role.id },
      { owner_employment_id: foreign_owner.id }, { owner_employment_id: departed_owner.id }].each do |changes|
      expect { receive_application(**changes) }.to raise_error(Hiring::Intake::InvalidInput)
    end
    expect(HiringApplication.count).to eq(0)
    expect(HiringCandidate.count).to eq(0)
  end

  it "rechecks persisted workspace and active membership before a mutation" do
    other = create(:company)
    User.where(id: admin.id).update_all(current_workspace_id: other.id)
    expect { receive_application }.to raise_error(Pundit::NotAuthorizedError)
    expect(HiringApplication.count).to eq(0)

    admin.update!(current_workspace: company)
    membership.discard
    expect { receive_application }.to raise_error(Pundit::NotAuthorizedError)
    expect(HiringApplication.count).to eq(0)
  end

  it "records the receipt time and actor while keeping personal content out of audit changes" do
    clear_enqueued_jobs
    travel_to Time.zone.parse("2026-10-25 08:00:00") do
      application = receive_application(notes: "Private screening note")
      expect(application.received_at).to eq(Time.current)
      audit = application.audits.find_by!(action: "create")
      expect(audit).to have_attributes(user_id: admin.id, associated_id: company.id)
      expect(audit.audited_changes.to_json).not_to include(attributes["email"], attributes["full_name"], "Private screening note")
    end
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(enqueued_jobs).to be_empty
  end
end

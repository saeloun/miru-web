# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollSources::MonthlyFacts do
  let(:company) { create(:company, base_currency: "INR") }
  let(:actor) { create(:user, current_workspace: company) }
  let(:user) { create(:user, current_workspace: company) }
  let!(:actor_employment) { create(:employment, company:, user: actor, resigned_at: nil) }
  let(:employment) { create(:employment, company:, user:, joined_at: Date.new(2020, 1, 1), resigned_at: nil) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:leave) { create(:leave, company:, year: 2026) }
  let(:leave_type) { create(:leave_type, leave:) }

  before { actor.add_role(:book_keeper, company) }

  def collect(**options)
    described_class.new(company:, employment:, actor:, month: "2026-11", **options).call
  end

  def work(**options)
    create(:timesheet_entry, user:, project:, work_date: Date.new(2026, 11, 2), **options)
  end

  def timeoff(**options)
    create(:timeoff_entry, user:, leave_type:, leave_date: Date.new(2026, 11, 2), **options)
  end

  def codes(facts)
    facts.fetch("review_exceptions").pluck("code")
  end

  it "collects fractional nonbillable work without private notes or pay inference" do
    entry = work(duration: 60.125, note: "private note", proof_url: "https://example.test/private")
    facts = collect

    expect(facts.fetch("work_entries").first).to include(
      "id" => entry.id, "duration_minutes" => "60.125", "date" => "2026-11-02",
      "review_status" => "not_required", "locked" => false
    )
    expect(facts.fetch("company_currency")).to eq("INR")
    expect(facts.to_json).not_to include("private note", "private", user.email, "paid_days", "net_pay")
    expect(codes(facts)).to include("missing_pay_policy", "missing_attendance_policy")
  end

  it "excludes other companies, coworkers and months from work and PTO" do
    own_work = work
    own_pto = timeoff
    other_company = create(:company)
    other_project = create(:project, client: create(:client, company: other_company))
    other_type = create(:leave_type, leave: create(:leave, company: other_company, year: 2026))
    work(user: actor)
    work(project: other_project)
    work(work_date: Date.new(2026, 12, 1))
    timeoff(user: actor)
    timeoff(leave_type: other_type)
    timeoff(leave_date: Date.new(2026, 10, 1))

    expect(collect.fetch("work_entries").pluck("id")).to eq([own_work.id])
    expect(collect.fetch("timeoff_entries").pluck("id")).to eq([own_pto.id])
  end

  it "requires current company membership and a fresh authorized role" do
    actor.remove_role(:book_keeper, company)
    actor.add_role(:admin, create(:company))
    expect { collect }.to raise_error(Pundit::NotAuthorizedError)
    actor.add_role(:owner, company)
    expect { collect }.not_to raise_error
    actor_employment.update_columns(discarded_at: Time.current)
    expect { collect }.to raise_error(Pundit::NotAuthorizedError)
  end

  it "rejects a different active workspace even with a company role" do
    actor.update!(current_workspace: create(:company))
    expect { collect }.to raise_error(Pundit::NotAuthorizedError)
  end

  it "rejects reviewers before their employment begins and after it ends" do
    actor_employment.update_columns(joined_at: Date.current + 1.day)
    expect { collect }.to raise_error(Pundit::NotAuthorizedError)
    actor_employment.update_columns(joined_at: Date.current - 1.year, resigned_at: Date.current - 1.day)
    expect { collect }.to raise_error(Pundit::NotAuthorizedError)
    actor_employment.update_columns(resigned_at: Date.current)
    expect { collect }.not_to raise_error
  end

  it "rejects discarded actors and target employments and cross-company employment ids" do
    employment.update_columns(discarded_at: Time.current)
    expect { collect }.to raise_error(ActiveRecord::RecordNotFound)
    foreign = create(:employment, company: create(:company), user:)
    expect do
      described_class.new(company:, employment: foreign, actor:, month: "2026-11").call
    end.to raise_error(ActiveRecord::RecordNotFound)
    actor.update_columns(discarded_at: Time.current)
    expect { collect }.to raise_error(Pundit::NotAuthorizedError)
  end

  it "collects ordinary, custom and holiday PTO references without labeling them paid" do
    ordinary = timeoff
    custom = create(:custom_leave, leave:)
    custom_entry = create(:timeoff_entry, user:, leave_type: nil, custom_leave: custom, leave_date: "2026-11-03")
    holiday = create(:holiday, company:, year: 2026)
    info = create(:holiday_info, holiday:, date: "2026-11-04")
    holiday_entry = create(:timeoff_entry, user:, leave_type: nil, holiday_info: info, leave_date: "2026-11-04")
    facts = collect

    expect(facts.fetch("timeoff_entries").pluck("id")).to eq([ordinary.id, custom_entry.id, holiday_entry.id])
    expect(facts.fetch("timeoff_entries").last.fetch("holiday_info")).to include("id" => info.id)
    expect(codes(facts)).to include("timeoff_pay_classification_required")
    expect(facts.fetch("timeoff_entries").to_json).not_to include("paid")
  end

  it "flags same-date work and PTO and unapproved work for accounts review" do
    entry = work(review_status: :pending_review)
    timeoff
    expect(codes(collect)).to include("work_timeoff_same_date", "work_review_required")
    entry.update!(review_status: :rejected)
    expect(codes(collect)).to include("work_review_required")
  end

  it "retains facts outside partial employment dates and flags them" do
    employment.update!(joined_at: Date.new(2026, 10, 15), resigned_at: Date.new(2026, 11, 1))
    entry = work
    facts = collect
    expect(facts.fetch("work_entries").pluck("id")).to include(entry.id)
    expect(codes(facts)).to include("partial_employment_month", "entry_outside_employment")
  end

  it "flags absent facts, missing dates and duplicate memberships without treating absence as zero pay" do
    employment.update_columns(joined_at: nil, employment_type: nil)
    create(:employment, company:, user:)
    expect(codes(collect)).to include(
      "no_work_entries", "no_timeoff_entries", "missing_employment_start", "missing_employment_type", "ambiguous_employment"
    )
  end

  it "returns immutable JSON data with capture time excluded from a stable digest" do
    work
    before = collect
    travel 1.minute do
      after = collect
      expect(after.fetch("digest")).to eq(before.fetch("digest"))
      expect(after.fetch("captured_at")).not_to eq(before.fetch("captured_at"))
    end
    expect { before.fetch("work_entries").first["duration_minutes"].replace("1") }.to raise_error(FrozenError)
    expect { before.fetch("review_exceptions") << {} }.to raise_error(FrozenError)
    expect(JSON.parse(before.to_json)).to eq(before)
  end

  it "changes the digest after work corrections, discard and deletion" do
    entry = work
    first = collect.fetch("digest")
    entry.update!(duration: 10.25)
    second = collect.fetch("digest")
    entry.update_columns(discarded_at: Time.current)
    third = collect.fetch("digest")
    expect([first, second, third].uniq.size).to eq(3)
    expect(collect.fetch("work_entries")).to be_empty
    entry.update_columns(discarded_at: nil)
    present = collect.fetch("digest")
    entry.destroy!
    expect(collect.fetch("digest")).not_to eq(present)
  end

  it "changes the digest for PTO correction, parent policy correction and discard" do
    entry = timeoff
    first = collect.fetch("digest")
    entry.update!(duration: 120)
    second = collect.fetch("digest")
    leave_type.update!(allocation_value: leave_type.allocation_value + 1)
    third = collect.fetch("digest")
    entry.update_columns(discarded_at: Time.current)
    fourth = collect.fetch("digest")
    expect([first, second, third, fourth].uniq.size).to eq(4)
    expect(collect.fetch("timeoff_entries")).to be_empty
  end

  it "binds source fingerprints to explicit policy versions" do
    work
    first = collect(policy_versions: { pay: "pay-v1", attendance: "attendance-v1" })
    second = collect(policy_versions: { pay: "pay-v2", attendance: "attendance-v1" })
    expect(first.fetch("digest")).not_to eq(second.fetch("digest"))
    expect(codes(first)).not_to include("missing_pay_policy", "missing_attendance_policy")
  end

  it "fingerprints material calendar settings but ignores unrelated company edits" do
    first = collect.fetch("digest")
    company.update!(name: "Renamed Synthetic Company")
    expect(collect.fetch("digest")).to eq(first)
    company.update!(working_hours: "35")
    expect(collect.fetch("digest")).not_to eq(first)
  end

  it "flags discarded definitions that still have kept timeoff entries" do
    entry = timeoff
    leave.update_columns(discarded_at: Time.current)
    facts = collect
    expect(facts.fetch("timeoff_entries").pluck("id")).to eq([entry.id])
    expect(codes(facts)).to include("discarded_timeoff_parent")
  end

  it "preserves nonfinite data as a review exception instead of coercing it to minutes" do
    work.update_columns(duration: Float::NAN)
    facts = collect
    expect(facts.fetch("work_entries").first.fetch("duration_minutes")).to be_nil
    expect(codes(facts)).to include("invalid_work_duration")
  end

  it "rejects malformed month and policy version inputs" do
    expect { described_class.new(company:, employment:, actor:, month: "2026-11-01") }.to raise_error(ArgumentError)
    expect { collect(policy_versions: { pay: { "arbitrary" => "data" } }) }.to raise_error(ArgumentError)
    expect { collect(policy_versions: { unknown: "version" }) }.to raise_error(ArgumentError)
    expect { collect(policy_versions: nil) }.to raise_error(ArgumentError)
  end

  describe ".current_snapshot?" do
    it "validates provenance without using the historical reviewer's active workspace" do
      work
      snapshot = collect
      actor.update!(current_workspace: create(:company))
      expect(described_class.current_snapshot?(snapshot, company:, employment:)).to be(true)
      expect { collect }.to raise_error(Pundit::NotAuthorizedError)
    end

    it "rejects a tampered digest, fact, binding and malformed snapshot" do
      work
      snapshot = collect
      altered = JSON.parse(snapshot.to_json)
      altered.fetch("work_entries").first["duration_minutes"] = "999.0"
      expect(described_class.current_snapshot?(altered, company:, employment:)).to be(false)
      expect(described_class.current_snapshot?(snapshot.merge("digest" => "0" * 64), company:, employment:)).to be(false)
      expect(described_class.current_snapshot?(snapshot, company: create(:company), employment:)).to be(false)
      expect(described_class.current_snapshot?({}, company:, employment:)).to be(false)
      expect(described_class.current_snapshot?(nil, company:, employment:)).to be(false)
      expect(described_class.current_snapshot?({ "company_id" => company.id, "employment" => "bad" }, company:, employment:))
        .to be(false)
    end

    it "detects source corrections, removals and target membership deactivation" do
      entry = work
      snapshot = collect
      entry.update!(duration: 90)
      expect(described_class.current_snapshot?(snapshot, company:, employment:)).to be(false)
      corrected = collect
      entry.update_columns(discarded_at: Time.current)
      expect(described_class.current_snapshot?(corrected, company:, employment:)).to be(false)
      absent = collect
      employment.update_columns(discarded_at: Time.current)
      expect(described_class.current_snapshot?(absent, company:, employment:)).to be(false)
    end
  end
end

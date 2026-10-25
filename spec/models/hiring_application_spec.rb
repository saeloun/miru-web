# frozen_string_literal: true

require "rails_helper"

RSpec.describe HiringApplication do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:application) do
    Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => Faker::Name.name,
      "email" => Faker::Internet.unique.email, "notes" => "Private candidate note"
    }).process
  end

  before { admin.add_role(:admin, company) }

  it "encrypts notes and original details and preserves the original snapshot on later edits" do
    record = application
    original = record.creation_details.deep_dup
    raw = described_class.connection.select_one(described_class.where(id: record.id).select(:creation_details, :notes).to_sql)
    expect(raw.values.join).not_to include(original["full_name"], original["email"], "Private candidate note")
    expect(record.hiring_candidate.inspect).not_to include(original["full_name"], original["email"])
    record.update!(notes: "Updated private note")
    expect(record.reload.creation_details).to eq(original)
    expect(record.update(creation_details: original.merge("full_name" => "Overwritten name"))).to eq(false)
    expect(record.errors.full_messages.join).to include("original application cannot be changed")
  end

  it "enforces candidate identity and request uniqueness at the database boundary" do
    record = application
    candidate = record.hiring_candidate
    expect do
      HiringCandidate.transaction(requires_new: true) do
        HiringCandidate.insert_all!([{ company_id: company.id, email: candidate.email, full_name: Faker::Name.name }])
      end
    end.to raise_error(ActiveRecord::RecordNotUnique)
    expect do
      described_class.transaction(requires_new: true) do
        described_class.insert_all!([record.attributes.except("id", "created_at", "updated_at")])
      end
    end.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "rejects candidate and role links crossing company boundaries even when validations are bypassed" do
    record = application
    other = create(:company)
    candidate = HiringCandidate.create!(company: other, full_name: Faker::Name.name, email: Faker::Internet.unique.email)
    role = HiringRole.create!(company: other, title: Faker::Job.title)
    [{ "hiring_candidate_id" => candidate.id }, { "hiring_role_id" => role.id }].each do |change|
      attributes = record.attributes.except("id", "created_at", "updated_at").merge(change, "request_key" => SecureRandom.uuid)
      expect do
        described_class.transaction(requires_new: true) { described_class.insert_all!([attributes]) }
      end.to raise_error(ActiveRecord::InvalidForeignKey)
    end
  end
end

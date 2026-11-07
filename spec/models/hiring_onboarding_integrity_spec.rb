# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("db/migrate/20261108030000_add_hiring_onboarding")
require Rails.root.join("db/migrate/20261108030100_validate_hiring_onboarding")

RSpec.describe "Hiring onboarding integrity" do
  include SignatureRequestFixtures
  include_context "issued offer records"

  it "validates tenant constraints and the one-invitation index in PostgreSQL" do
    connection = ActiveRecord::Base.connection
    invitation_key = connection.foreign_keys(:invitations).find { |key| key.to_table == "hiring_offers" }
    profile_key = connection.foreign_keys(:hiring_offers).find { |key| key.to_table == "employments" }
    expect(invitation_key.options).to include(column: %w[company_id hiring_offer_id], primary_key: %w[company_id id], on_delete: :cascade, validate: true)
    expect(profile_key.options).to include(column: %w[company_id employment_id], primary_key: %w[company_id id], validate: true)
    expect(connection.indexes(:invitations).find { |index| index.columns == ["hiring_offer_id"] }.unique).to be(true)
    expect(connection.check_constraints(:hiring_offers).find { |check| check.name == "hiring_offer_onboarding_state" }).to be_validate
  end

  it "rejects cross-company invitation and profile links at the database boundary" do
    record = started_onboarding_record
    other = create(:employment, resigned_at: nil)
    expect do
      ActiveRecord::Base.transaction(requires_new: true) { record.onboarding_invitation.update_columns(company_id: other.company_id) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect do
      ActiveRecord::Base.transaction(requires_new: true) do
        record.update_columns(employment_id: other.id, onboarded_at: Time.current, onboarding_completion_details: { "test" => "foreign target" })
      end
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect(record.reload.employment_id).to be_nil
  end

  it "keeps confirmed intent encrypted, unaudited as plaintext and immutable" do
    record = started_onboarding_record
    expect(record.read_attribute_before_type_cast("onboarding_details")).not_to include("Taylor", "Candidate")
    expect(record.audits.pluck(:audited_changes).to_json).not_to include("Taylor", "Candidate")
    expect(record.update(onboarding_details: { "intent" => "replacement" })).to be(false)
    expect(record.errors.full_messages.join).to include("cannot be rewritten")
    expect(record.reload.onboarding_invitation.update(hiring_offer_id: nil)).to be(false)
  end

  it "removes live invitation capabilities on raw source purge while retaining the employee and uploaded legal files" do
    record = started_onboarding_record
    invitation = record.onboarding_invitation
    service = CreateInvitedUserService.new(invitation.token)
    service.process
    expect(service.success).to be(true), service.error_message
    employment = record.reload.employment
    signature = approved_signature_request(company:, actor: admin, employment:)
    revision = signature.current_revision
    bytes = revision.documents.map { |document| revision.original_bytes(document.fetch("key")) }
    expect(HiringApplication.where(id: record.hiring_application_id).delete_all).to eq(1)
    expect(HiringOffer.exists?(record.id)).to be(false)
    expect(Invitation.exists?(invitation.id)).to be(false)
    expect(Employment.exists?(employment.id)).to be(true)
    expect(EmployeeRecord.exists?(employment_id: employment.id)).to be(true)
    expect(SignatureRequest.exists?(signature.id)).to be(true)
    expect(revision.reload.documents.map { |document| revision.original_bytes(document.fetch("key")) }).to eq(bytes)
    retry_service = CreateInvitedUserService.new(invitation.token)
    retry_service.process
    expect(retry_service.success).to be(false)
  end

  it "blocks both rollback steps before changing indexes or constraints when onboarding is recorded" do
    started_onboarding_record
    connection = ActiveRecord::Base.connection
    indexes = connection.indexes(:invitations).map(&:name)
    [ValidateHiringOnboarding, AddHiringOnboarding].each do |migration|
      expect { migration.new.down }.to raise_error(ActiveRecord::IrreversibleMigration, /Preserve recorded hiring onboarding/)
    end
    expect(connection.indexes(:invitations).map(&:name)).to eq(indexes)
    expect(connection.check_constraints(:hiring_offers).map(&:name)).to include("hiring_offer_onboarding_state")
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring communication settings" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:details) do
    { "company_intro" => "We build and maintain software for our clients.", "client_count" => 5,
      "working_arrangements" => "Remote work with an office in Pune.", "working_week" => "40 hours per week.",
      "overlap" => "Four hours with the assigned US or European team; exact times are agreed during hiring.",
      "pto" => "PTO follows the applicable employee or consultant engagement policy.",
      "hiring_process" => "We review the application and confirm the next step individually.",
      "acknowledgement_subject" => "Application received", "acknowledgement_body" => "Thank you for applying." }
  end
  let(:configuration) { Hiring::Configure.new(company:, actor: admin) }

  before { admin.add_role(:admin, company) }

  it "requires explicit approval and invalidates it when the saved email or policy changes" do
    setting = configuration.save_draft!(details:, lock_version: nil)
    expect(setting.approved?).to be(false)
    expect(setting.read_attribute_before_type_cast(:details)).not_to include(details.fetch("company_intro"))

    approved = configuration.approve!(lock_version: setting.lock_version)
    expect(approved.approved?).to be(true)
    expect(approved.approved_by_id).to eq(admin.id)
    changed = configuration.save_draft!(details: details.merge("acknowledgement_body" => "An updated introduction."),
      lock_version: approved.lock_version)
    expect(changed.approved?).to be(false)
    expect(changed.approved_at).to be_nil
    expect(changed.approved_by_id).to be_nil
    expect(changed.audits.reorder(id: :desc).first.audited_changes["approved_by_id"]).to eq([admin.id, nil])
    expect(changed.audits.pluck(:audited_changes).to_json).not_to include("An updated introduction.")
    expect(HiringMessage.count).to eq(0)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "saves an empty draft as missing information and records its creator without recording the text" do
    setting = configuration.save_draft!(details: {}, lock_version: nil)

    expect(setting).to be_persisted
    expect(setting.details["client_count"]).to be_nil
    expect(setting.approved?).to be(false)
    creation = setting.audits.find_by!(action: "create")
    expect(creation.user_id).to eq(admin.id)
    expect(creation.audited_changes).not_to have_key("details")
    expect { configuration.approve!(lock_version: setting.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)
    expect(HiringMessage.count).to eq(0)
  end

  it "keeps an unknown client count missing while allowing an explicitly approved zero" do
    draft = configuration.save_draft!(details: details.merge("client_count" => nil), lock_version: nil)
    expect(draft.details.fetch("client_count")).to be_nil
    expect { configuration.approve!(lock_version: draft.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)

    complete = configuration.save_draft!(details: details.merge("client_count" => 0), lock_version: draft.reload.lock_version)
    expect(configuration.approve!(lock_version: complete.lock_version).approved?).to be(true)
    expect(company.reload.hiring_setting.details.fetch("client_count")).to eq(0)
  end

  it "rejects unknown fields, typed-data attacks and header injection without changing the draft" do
    setting = configuration.save_draft!(details:, lock_version: nil)
    [{ "unexpected" => "value" }, { "client_count" => "5" }, { "client_count" => -1 },
      { "company_intro" => { "text" => "Injected" } },
      { "acknowledgement_subject" => "Receipt\r\nBcc:other@example.test" }].each do |change|
      expect do
        configuration.save_draft!(details: details.merge(change), lock_version: setting.lock_version)
      end.to raise_error(Hiring::Intake::InvalidInput)
    end
    expect(setting.reload.details).to eq(details)
  end

  it "protects against lost edits and stale approval requests" do
    setting = configuration.save_draft!(details:, lock_version: nil)
    old_version = setting.lock_version
    updated = configuration.save_draft!(details: details.merge("client_count" => 6), lock_version: old_version)

    expect { configuration.approve!(lock_version: old_version) }.to raise_error(Hiring::Intake::Conflict)
    expect do
      configuration.save_draft!(details:, lock_version: old_version)
    end.to raise_error(Hiring::Intake::Conflict)
    expect(updated.reload.details.fetch("client_count")).to eq(6)
    expect(updated.approved?).to be(false)
  end

  it "rechecks the actor's persisted workspace, active employment and hiring role for changes and approvals" do
    setting = configuration.save_draft!(details:, lock_version: nil)
    other = create(:company)
    User.where(id: admin.id).update_all(current_workspace_id: other.id)
    expect { configuration.approve!(lock_version: setting.lock_version) }.to raise_error(Pundit::NotAuthorizedError)

    admin.update!(current_workspace: company)
    membership.discard
    expect { configuration.approve!(lock_version: setting.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    expect { configuration.save_draft!(details:, lock_version: setting.lock_version) }.to raise_error(Pundit::NotAuthorizedError)

    membership.undiscard
    admin.remove_role(:admin, company)
    admin.add_role(:employee, company)
    expect { configuration.approve!(lock_version: setting.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    expect(setting.reload.approved_at).to be_nil
  end
end

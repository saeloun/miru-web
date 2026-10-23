# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employment, "staff employee IDs", type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user) }

  it "assigns after a staff role is added without completing or saving the profile" do
    employment = create(:employment, company:, user:, employee_id: nil, designation: nil,
      employment_type: nil, joined_at: nil, resigned_at: nil)
    employment.designation = "Unsaved"

    user.add_role(:employee, company)

    expect(employment.ensure_employee_id!).to eq("SI001")
    expect(employment.reload.attributes.values_at("employee_id", "designation", "joined_at", "employment_type"))
      .to eq(["SI001", nil, nil, nil])
  end

  it "assigns when the role precedes membership and keeps custom IDs unchanged" do
    user.add_role(:manager, company)
    employment = create(:employment, company:, user:, employee_id: nil)
    expect(employment.employee_id).to eq("SI001")
    custom = create(:employment, company:, user:, employee_id: " custom ")
    expect(custom.ensure_employee_id!).to eq(" custom ")
  end

  it "excludes roleless, client-only and discarded memberships" do
    employment = create(:employment, company:, user:, employee_id: nil)
    expect(employment.ensure_employee_id!).to be_nil
    user.add_role(:client, company)
    expect(employment.reload.employee_id).to be_nil
    employment.discard!
    user.add_role(:admin, company)
    expect(employment.reload.employee_id).to be_nil
  end

  it "ignores employment dates and keeps the ID through role removal, discard and restore" do
    user.add_role(:employee, company)
    employment = create(:employment, company:, user:, employee_id: nil, employment_type: "contractor",
      joined_at: Date.tomorrow, resigned_at: Date.tomorrow + 1.day)
    user.remove_role(:employee, company)
    user.add_role(:client, company)
    employment.discard!
    employment.undiscard!

    expect(employment.ensure_employee_id!).to eq("SI001")
    expect(employment.reload).to have_attributes(
      employment_type: "contractor", joined_at: Date.tomorrow, resigned_at: Date.tomorrow + 1.day)
    expect(user.has_role?(:employee, company)).to be(false)
  end

  it "uses all historical SI suffixes and retains the high-water after correction and deletion" do
    historic = create(:employment, company:, discarded_at: Time.current)
    historic.update_columns(employee_id: "SI063")
    user.add_role(:employee, company)
    employment = create(:employment, company:, user:, employee_id: nil)
    expect(employment.employee_id).to eq("SI064")
    employment.update_profile!(employee_id: "SI1000")
    employment.update_profile!(employee_id: "custom")
    historic.destroy!
    expect(create(:employment, company:, user:, employee_id: nil).employee_id).to eq("SI1001")
    expect(create(:employment, company: create(:company), user:, employee_id: "SI063")).to be_persisted
  end

  it "starts independently in another company and never reuses a deleted generated number" do
    user.add_role(:employee, company)
    create(:employment, company:, user:, employee_id: nil).destroy!
    expect(create(:employment, company:, user:, employee_id: nil).employee_id).to eq("SI002")
    other_company = create(:company)
    user.add_role(:employee, other_company)
    expect(create(:employment, company: other_company, user:, employee_id: nil).employee_id).to eq("SI001")
  end

  it "reserves pre-feature SI numbers before their first correction or deletion" do
    corrected = create(:employment, company:)
    deleted = create(:employment, company:)
    corrected.update_columns(employee_id: "SI063")
    corrected.update_profile!(employee_id: "corrected")
    expect(company.reload.last_employee_number).to eq(63)
    deleted.update_columns(employee_id: "SI1000")
    deleted.destroy!
    user.add_role(:employee, company)
    expect(create(:employment, company:, user:, employee_id: nil).employee_id).to eq("SI1001")
  end

  it "rejects an exact duplicate from discarded history while preserving case and company scope" do
    create(:employment, company:, employee_id: "ID", discarded_at: Time.current)
    employment = create(:employment, company:, employee_id: "id")
    expect { employment.update_profile!(employee_id: "ID") }.to raise_error(ActiveRecord::RecordInvalid)
    expect(employment.reload.employee_id).to eq("id")
    expect(create(:employment, employee_id: "ID")).to be_persisted
  end

  it "rejects SI numbers outside the supported range without overflowing" do
    employment = create(:employment, company:)
    expect { employment.update_profile!(employee_id: "SI99999999999999999999") }
      .to raise_error(ActiveRecord::RecordInvalid, /Employee.*supported range/i)
  end

  it "repairs a restored membership through the retained-role wrapper idempotently" do
    user.add_role(:book_keeper, company)
    employment = create(:employment, company:, user:, employee_id: "existing")
    employment.update_columns(employee_id: nil, discarded_at: Time.current)
    employment.undiscard!
    user.current_company = company
    user.role = "book_keeper"
    2.times { user.assign_company_and_role }
    expect(employment.reload.employee_id).to eq("SI001")
    expect(company.reload.last_employee_number).to eq(1)
  end

  it "enforces exact uniqueness in the database as well as model validation" do
    create(:employment, company:, employee_id: "reserved", discarded_at: Time.current)
    employment = create(:employment, company:)
    expect do
      Employment.transaction(requires_new: true) { employment.update_columns(employee_id: "reserved") }
    end.to raise_error(ActiveRecord::RecordNotUnique) { |error| expect(Employment.employee_id_conflict?(error)).to be(true) }
  end

  it "assigns a number when an actual team role change promotes a client" do
    actor = create(:user)
    actor.add_role(:owner, company)
    employment = create(:employment, company:, user:, employee_id: nil)
    user.add_role(:client, company)
    Team::UpdateService.new(actor:, user_params: {}, current_company: company, new_role: "employee", user:).process
    expect(employment.reload.employee_id).to eq("SI001")
    expect(employment.employment_type).to eq("Salaried")
  end

  it "assigns IDs through company creation and invitation acceptance, leaving clients blank" do
    owned_company = CreateCompanyService.new(user, params: attributes_for(:company)).process
    owner_employment = user.employments.find_by!(company: owned_company)
    expect(owner_employment.employee_id).to eq("SI001")
    expect(owner_employment.joined_at).to be_nil
    invitation = create(:invitation, company:)
    service = CreateInvitedUserService.new(invitation.token)
    service.process
    expect(service.success).to be(true)
    expect(service.user.employments.kept.find_by!(company:).employee_id).to eq("SI001")
    client_invitation = create(:invitation, company:, role: "client", client: create(:client, company:))
    client_service = CreateInvitedUserService.new(client_invitation.token)
    client_service.process
    expect(client_service.success).to be(true)
    expect(client_service.user.employments.kept.find_by!(company:).employee_id).to be_nil
  end

  it "restores and numbers a reinvited user whose staff role was retained" do
    user.add_role(:employee, company)
    employment = create(:employment, company:, user:, employee_id: "legacy")
    employment.update_columns(employee_id: nil, discarded_at: Time.current)
    invitation = create(:invitation, company:, recipient_email: user.email)

    service = CreateInvitedUserService.new(invitation.token)
    service.process

    expect(service.success).to be(true)
    expect(employment.reload).to be_kept
    expect(employment.employee_id).to eq("SI001")
  end
end

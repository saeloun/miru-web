# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant bank-change journal" do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  it "records only active owners and explicitly assigned accounts for a persisted bank edit" do
    run
    stranger = create(:user)
    create(:employment, company:, user: stranger, joined_at: "2020-01-01", resigned_at: nil)
    stranger.add_role(:book_keeper, company)
    stranger.add_role(:admin, company)
    assigned_admin = create(:user)
    create(:employment, company:, user: assigned_admin, joined_at: "2020-01-01", resigned_at: nil)
    assigned_admin.add_role(:admin, company)
    PayrollRun.create!(company:, period: run.period.next_month, currency: "INR", accounts_reviewer: assigned_admin, final_reviewer: owner)
    record = employment.employee_record
    expect { record.update!(private_details: bank_details.merge("bank_name" => "Changed Bank")) }
      .to change { PayrollBankChangeNotice.count }.by(3)
    notices = PayrollBankChangeNotice.order(:id)
    expect(notices.pluck(:recipient_id)).to match_array([owner.id, accounts.id, assigned_admin.id])
    expect(notices.pluck(:event_id).uniq.size).to eq(1)
    expect(notices.pluck(:state).uniq).to eq(["queued"])
    expect(notices.map(&:attributes).to_json).not_to include("Changed Bank", bank_details.fetch("bank_account_number"))
  end

  it "does not create events for unchanged, contact or salary saves but keeps A to B to A distinct" do
    record = employment.employee_record
    record.update!(private_details: bank_details.merge("emergency_contact_name" => "Contact", "salary_amount" => "50000"))
    expect(PayrollBankChangeNotice.count).to eq(0)
    record.save!
    expect(PayrollBankChangeNotice.count).to eq(0)
    record.update!(private_details: bank_details.merge("bank_name" => "Changed"))
    record.update!(private_details: bank_details)
    expect(PayrollBankChangeNotice.distinct.count(:event_id)).to eq(2)
    record.update!(private_details: bank_details.merge("bank_account_number" => ""))
    expect(PayrollBankChangeNotice.distinct.count(:event_id)).to eq(3)
  end

  it "captures initial configured bank data and rolls the journal back with the profile" do
    record = employment.employee_record
    record.update!(private_details: { "family_members" => [] })
    PayrollBankChangeNotice.delete_all
    expect { record.update!(private_details: bank_details) }.to change(PayrollBankChangeNotice, :count).by(1)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        record.update!(private_details: bank_details.merge("bank_name" => "Rollback"))
        raise ActiveRecord::Rollback
      end
    end.not_to change(PayrollBankChangeNotice, :count)
    expect(record.reload.private_details).to eq(bank_details)
  end

  it "does not disturb employee profiles without entitlement or consultant configuration" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    employment.employee_record.update!(private_details: bank_details.merge("bank_name" => "Disabled"))
    expect(PayrollBankChangeNotice.count).to eq(0)
    enable_synthetic_payroll(company.id)
    other = create(:employment, company:, resigned_at: nil)
    EmployeeRecord.create!(employment: other, private_details: bank_details)
    ConsultantCompensation.create!(employment: other, created_by: owner, effective_on: Date.tomorrow, monthly_fee: 50_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Future entity", change_reason: "Future configuration")
    other.employee_record.update!(private_details: bank_details.merge("bank_name" => "Future configuration"))
    expect(PayrollBankChangeNotice.count).to eq(0)
  end

  it "rechecks active membership and exact reviewer assignment without requiring selected workspace" do
    run
    employment.employee_record.update!(private_details: bank_details.merge("bank_name" => "Changed"))
    notices = PayrollBankChangeNotice.all.index_by(&:recipient_id)
    accounts.update!(current_workspace: create(:company))
    expect(notices.fetch(accounts.id).recipient_eligible?).to be(true)
    accounts.remove_role(:book_keeper, company)
    expect(notices.fetch(accounts.id).recipient_eligible?).to be(false)
    owner.employments.find_by!(company:).update!(resigned_at: "2026-12-04")
    expect(notices.fetch(owner.id).recipient_eligible?).to be(false)
  end

  it "enforces SQL tenant identity, unique delivery and constrained states" do
    employment.employee_record.update!(private_details: bank_details.merge("bank_name" => "Changed"))
    notice = PayrollBankChangeNotice.sole
    base = notice.attributes.except("id")
    invalid = [base, base.merge("event_id" => SecureRandom.uuid, "employment_id" => create(:employment).id),
      base.merge("event_id" => SecureRandom.uuid, "state" => "sent")]
    invalid.each do |attributes|
      expect { ApplicationRecord.transaction(requires_new: true) { PayrollBankChangeNotice.insert_all!([attributes]) } }
        .to raise_error(ActiveRecord::StatementInvalid)
    end
    expect(PayrollBankChangeNotice.count).to eq(1)
  end
end

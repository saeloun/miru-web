# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeRecord, "payroll source version" do
  let!(:record) { create(:employee_record, private_details: { "bank_account_number" => Faker::Number.number(digits: 12).to_s }) }

  it "requires stale bank writers to reload before advancing the payroll version" do
    stale = described_class.find(record.id)
    previous = record.payroll_version

    record.update!(private_details: record.private_details.merge("bank_name" => Faker::Company.name))
    expect do
      stale.update!(private_details: stale.private_details.merge("bank_branch" => Faker::Address.city))
    end.to raise_error(ActiveRecord::StaleObjectError)
    expect(record.reload.payroll_version).to eq(previous + 1)

    stale.reload.update!(private_details: record.private_details.merge("bank_branch" => Faker::Address.city))

    expect(record.reload.payroll_version).to eq(previous + 2)
  end

  it "rejects a stale unrelated edit that would restore old bank instructions" do
    stale = described_class.find(record.id)
    bank_name = Faker::Company.name
    record.update!(private_details: record.private_details.merge("bank_name" => bank_name))
    approved_version = record.reload.payroll_version

    expect do
      stale.update!(private_details: stale.private_details.merge("emergency_contact_name" => Faker::Name.name))
    end.to raise_error(ActiveRecord::StaleObjectError)

    expect(record.reload.payroll_version).to eq(approved_version)
    expect(record.private_details.fetch("bank_name")).to eq(bank_name)
  end

  it "rolls the version back with a failed outer transaction" do
    previous = record.payroll_version
    original = record.private_details.dup

    described_class.transaction do
      record.update!(private_details: original.merge("bank_account_number" => "9876543210"))
      raise ActiveRecord::Rollback
    end

    expect(record.reload.payroll_version).to eq(previous)
    expect(record.private_details).to eq(original)
  end

  it "does not advance for rejected changes" do
    previous = record.payroll_version

    expect(record.update(private_details: record.private_details.merge("bank_ifsc" => "invalid"))).to be(false)
    expect(record.reload.payroll_version).to eq(previous)
  end

  it "does not treat absent, null and blank optional bank fields as different payment instructions" do
    previous = record.payroll_version
    record.update!(private_details: record.private_details.merge("bank_name" => nil))
    record.update!(private_details: record.private_details.merge("bank_name" => ""))

    expect(record.reload.payroll_version).to eq(previous)
  end

  it "advances when a bank account is cleared" do
    previous = record.payroll_version
    record.update!(private_details: record.private_details.merge("bank_account_number" => nil))

    expect(record.reload.payroll_version).to eq(previous + 1)
  end

  it "advances for salary changes but preserves the version for contact, family and unchanged values" do
    previous = record.payroll_version
    record.update!(private_details: record.private_details.merge("emergency_contact_name" => Faker::Name.name,
      "family_members" => [{ "name" => Faker::Name.name }]))
    expect(record.reload.payroll_version).to eq(previous)

    record.update!(private_details: record.private_details.merge("salary_amount" => "1200", "salary_currency" => "INR"))
    expect(record.reload.payroll_version).to eq(previous + 1)
    record.update!(private_details: record.private_details.dup)
    expect(record.reload.payroll_version).to eq(previous + 1)
  end

  it "rejects a negative version even through direct database writes" do
    expect do
      described_class.transaction(requires_new: true) { record.update_columns(payroll_version: -1) }
    end.to raise_error(ActiveRecord::StatementInvalid, /employee_records_payroll_version_nonnegative/)
  end
end

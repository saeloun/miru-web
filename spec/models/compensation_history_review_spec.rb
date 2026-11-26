# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompensationVersion, "legacy salary review" do
  let(:company) { create(:company, timezone: "Asia/Kolkata") }
  let(:employment) { create(:employment, company:) }
  let(:salary) do
    { "salary_amount" => "1000.00", "salary_currency" => "INR", "salary_frequency" => "monthly", "salary_effective_on" => "2026-11-01" }
  end

  it "withholds legacy salary history rather than choosing an unverified pending raise" do
    record = employment.create_employee_record!(private_details: salary)
    pending = salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10")
    employment.compensation_versions.create!(effective_on: "2026-11-10", salary_details: pending)
    record.update_columns(private_details: salary.merge("salary_amount" => "3000.00", "salary_effective_on" => "2026-11-20"))
    travel_to(Time.utc(2026, 11, 11, 12)) do
      expect(record.current_salary.values).to all(be_nil)
      expect(described_class.history_requires_review?(employment)).to be(true)
      expect(described_class.terms_for(employment)).to be_empty
    end
  end

  it "does not acknowledge unknown history merely because an administrator enters a correction" do
    record = employment.create_employee_record!(private_details: salary)
    legacy = employment.compensation_versions.create!(effective_on: "2026-11-10", salary_details: salary)
    record.update!(private_details: salary.merge("salary_amount" => "1500.00"))
    expect(described_class.history_requires_review?(employment)).to be(true)
    expect(legacy.reload.superseded_at).to be_nil
  end

  [nil, ""].each do |empty_date|
    it "does not resurrect retired configured terms with an empty date #{empty_date.inspect}" do
      record = employment.create_employee_record!(private_details: salary.merge("salary_effective_on" => empty_date))
      employment.compensation_versions.update_all(superseded_at: Time.current)
      employment.compensation_versions.reset
      expect(record.current_salary.values).to all(be_nil)
    end
  end

  it "does not resurrect retired undated terms with an absent effective-date key" do
    record = employment.create_employee_record!(private_details: salary.except("salary_effective_on"))
    employment.compensation_versions.update_all(superseded_at: Time.current)
    employment.compensation_versions.reset
    expect(record.current_salary.values).to all(be_nil)
  end

  it "does not recreate abandoned past terms when a later salary is declared" do
    travel_to(Time.utc(2026, 11, 26, 12)) do
      record = employment.create_employee_record!(private_details: salary)
      employment.compensation_versions.update_all(superseded_at: Time.current, reviewed_at: nil)
      employment.compensation_versions.reset
      correction = salary.merge("salary_amount" => "1500.00", "salary_effective_on" => "2026-11-26")

      record.update!(private_details: correction)

      expect(employment.compensation_versions.active.map(&:salary_details)).to eq([correction])
      expect(record.current_salary).to eq(correction)
    end
  end

  it "marks new explicit declarations reviewed but keeps a legacy observation unresolved" do
    record = employment.create_employee_record!(private_details: salary)
    expect(employment.compensation_versions.last.reviewed_at).to be_present
    employment.compensation_versions.delete_all
    record.update!(private_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-12-01"))
    observed, declaration = employment.compensation_versions.order(:id).to_a
    expect(observed.reviewed_at).to be_nil
    expect(declaration.reviewed_at).to be_present
    expect(described_class.history_requires_review?(employment)).to be(true)
  end
end

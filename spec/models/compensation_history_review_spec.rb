# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompensationVersion, "legacy salary review" do
  let(:company) { create(:company, timezone: "Asia/Kolkata") }
  let(:employment) { create(:employment, company:) }
  let(:salary) do
    { "salary_amount" => "1000.00", "salary_currency" => "INR", "salary_frequency" => "monthly", "salary_effective_on" => "2026-11-01" }
  end


  context "with raw legacy salary and an existing future version from the old report writer" do
    let(:salary) do
      { "salary_amount" => "1000.00", "salary_currency" => "INR", "salary_frequency" => "monthly", "salary_effective_on" => "2026-01-01" }
    end
    let!(:record) do
      employment.create_employee_record!(private_details: salary).tap { employment.compensation_versions.delete_all }
    end
    let!(:future) do
      employment.compensation_versions.create!(effective_on: "2026-12-01",
        salary_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-12-01"), reviewed_at: Time.current)
    end

    around { |example| travel_to(Time.utc(2026, 11, 28, 12)) { example.run } }

    it "withholds unmatched legacy facts even after the future term was retained" do
      expect { record.current_salary }.not_to change(CompensationVersion, :count)
      expect(described_class.history_requires_review?(employment)).to be(true)
      expect(described_class.terms_for(employment)).to be_empty
      expect(record.current_salary.values).to all(be_nil)
    end

    it "observes the missing original once without approving it and restores it after explicit review" do
      observed = nil
      expect { observed = record.observe_legacy_salary! }.to change(CompensationVersion, :count).by(1)
      expect(observed).to have_attributes(effective_on: Date.new(2026, 1, 1), salary_details: salary, reviewed_at: nil)
      expect { record.observe_legacy_salary! }.not_to change(CompensationVersion, :count)
      expect(described_class.history_requires_review?(employment.reload)).to be(true)
      observed.update!(reviewed_at: Time.current)
      expect(record.reload.current_salary).to eq(salary)
      expect(described_class.terms_for(employment.reload).map(&:last)).to eq([salary, future.salary_details])
    end

    it "does not duplicate or revive a matching retired payload" do
      retired = employment.compensation_versions.create!(effective_on: "2026-01-01",
        salary_details: salary, superseded_at: Time.current)
      expect { record.observe_legacy_salary! }.not_to change(CompensationVersion, :count)
      expect(described_class.history_requires_review?(employment.reload)).to be(false)
      expect(record.reload.current_salary.values).to all(be_nil)
      expect(retired.reload.superseded_at).to be_present
    end
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

  it "does not recreate abandoned undated terms when a salary is edited on a later day" do
    record = nil
    travel_to(Time.utc(2026, 11, 1, 12)) do
      record = employment.create_employee_record!(private_details: salary.except("salary_effective_on"))
      employment.compensation_versions.update_all(superseded_at: Time.current, reviewed_at: nil)
      employment.compensation_versions.reset
    end
    travel_to(Time.utc(2026, 11, 26, 12)) do
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

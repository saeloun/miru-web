# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmployeeRecord, "salary history" do
  let(:company) { create(:company, timezone: "Asia/Kolkata") }
  let(:employment) { create(:employment, company:) }
  let(:salary) do
    { "salary_amount" => "1000.00", "salary_currency" => "INR", "salary_frequency" => "monthly", "salary_effective_on" => "2026-11-01" }
  end
  let(:record) { employment.create_employee_record!(private_details: salary) }

  [["later", "2026-11-20", "2500.00", "1000.00"],
    ["earlier", "2026-11-08", "2500.00", "2500.00"],
    ["back to current terms", "2026-11-01", "1000.00", "1000.00"],
    ["on the same pending date", "2026-11-10", "2500.00", "2500.00"]].each do |description, date, amount, expected|
    it "replaces a pending salary #{description} while retaining the abandoned terms" do
      pending = salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10")
      abandoned = nil
      travel_to(Time.utc(2026, 11, 5, 12)) do
        record.update!(private_details: pending)
        abandoned = employment.compensation_versions.find_by!(effective_on: "2026-11-10")

        record.update!(private_details: salary.merge("salary_amount" => amount, "salary_effective_on" => date))

        expect(abandoned.reload.superseded_at).to be_present
        expect(abandoned.salary_details).to eq(pending)
        expect(abandoned.effective_on).to eq(Date.new(2026, 11, 10))
      end

      travel_to(Time.utc(2026, 11, 11, 12)) do
        expect(record.reload.current_salary.fetch("salary_amount")).to eq(expected)
      end
      travel_to(Time.utc(2026, 11, 21, 12)) do
        expect(record.reload.current_salary.fetch("salary_amount")).to eq(amount)
      end
    end
  end

  ["2026-11-01", "2026-11-05"].each do |effective_on|
    it "retains already-effective terms from #{effective_on} as active history" do
      travel_to(Time.utc(2026, 11, 5, 12)) do
        record.update!(private_details: salary.merge("salary_effective_on" => effective_on))
        original = employment.compensation_versions.order(:id).last

        record.update!(private_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-20"))

        expect(original.reload.superseded_at).to be_nil
      end
    end
  end

  it "supersedes all active corrections of the replaced pending date and preserves other dates" do
    travel_to(Time.utc(2026, 11, 5, 12)) do
      pending = salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10")
      record.update!(private_details: pending)
      matching = employment.compensation_versions.find_by!(effective_on: "2026-11-10")
      correction = employment.compensation_versions.create!(effective_on: "2026-11-10", salary_details: pending.merge("salary_amount" => "2200.00"), reviewed_at: Time.current)
      other_date = employment.compensation_versions.create!(effective_on: "2026-11-12",
        salary_details: pending.merge("salary_amount" => "2300.00", "salary_effective_on" => "2026-11-12"), reviewed_at: Time.current)
      previously_superseded = employment.compensation_versions.create!(effective_on: "2026-11-10", salary_details: pending,
        superseded_at: 1.day.ago)
      previous_timestamp = previously_superseded.superseded_at
      original_ids = employment.compensation_versions.pluck(:id)

      record.update!(private_details: salary)

      expect(matching.reload.superseded_at).to eq(Time.current)
      expect(correction.reload.superseded_at).to eq(Time.current)
      expect(other_date.reload.superseded_at).to be_nil
      expect(previously_superseded.reload.superseded_at).to eq(previous_timestamp)
      expect(employment.compensation_versions.pluck(:id)).to include(*original_ids)
    end

    travel_to(Time.utc(2026, 11, 11, 12)) do
      expect(record.reload.current_salary.fetch("salary_amount")).to eq("1000.00")
    end
  end

  it "records supersession IDs and clears them after an unchanged save" do
    pending = nil
    travel_to(Time.utc(2026, 11, 4, 12)) do
      record.update!(private_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10"))
      pending = employment.compensation_versions.find_by!(effective_on: "2026-11-10")
    end

    travel_to(Time.utc(2026, 11, 5, 12)) do
      record.update!(private_details: salary)

      expect(record.superseded_compensation_version_ids).to eq([pending.id])
      expect(pending.reload.updated_at).to eq(pending.superseded_at)
      expect do
        record.save!
      end.not_to change { pending.reload.superseded_at }
      expect(record.superseded_compensation_version_ids).to eq([])
    end
  end

  [:none, :reviewed_correction, :unreviewed_correction].each do |history|
    it "preserves missing future legacy terms when existing history is #{history}" do
      travel_to(Time.utc(2026, 11, 5, 12)) do
        prior = salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10")
        record.update!(private_details: prior)
        employment.compensation_versions.delete_all
        correction = unless history == :none
          employment.compensation_versions.create!(effective_on: "2026-11-10",
            salary_details: prior.merge("salary_amount" => "2200.00"),
            reviewed_at: (Time.current if history == :reviewed_correction))
        end
        replacement = salary.merge("salary_amount" => "3000.00", "salary_effective_on" => "2026-11-20")

        employment.with_lock { record.update!(private_details: replacement) }

        preserved = employment.compensation_versions.reload.find { |version| version.salary_details == prior }
        expect(preserved).to be_present
        expect(preserved.effective_on).to eq(Date.new(2026, 11, 10))
        expect(preserved.reviewed_at).to be_nil
        expect(preserved.superseded_at).to eq(Time.current)
        expect(record.superseded_compensation_version_ids).to include(preserved.id)
        expect(record.reload.private_details).to eq(replacement)
        if correction
          expect(correction.reload.superseded_at).to eq(history == :reviewed_correction ? Time.current : nil)
        end
        original_ids = employment.compensation_versions.order(:id).pluck(:id)
        record.save!
        expect(employment.compensation_versions.order(:id).pluck(:id)).to eq(original_ids)
        expect(record.superseded_compensation_version_ids).to eq([])
      end
    end
  end

  [false, true].each do |retired|
    it "does not duplicate or reclassify a preserved future legacy payload with retired=#{retired}" do
      travel_to(Time.utc(2026, 11, 5, 12)) do
        prior = salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10")
        record.update!(private_details: prior)
        employment.compensation_versions.delete_all
        original = employment.compensation_versions.create!(effective_on: "2026-11-10", salary_details: prior,
          superseded_at: (1.day.ago if retired))
        original_timestamp = original.superseded_at

        record.update!(private_details: salary.merge("salary_amount" => "3000.00", "salary_effective_on" => "2026-11-20"))

        expect(employment.compensation_versions.count).to eq(2)
        expect(original.reload.salary_details).to eq(prior)
        expect(original.superseded_at).to eq(original_timestamp)
        expect(original.reviewed_at).to be_nil
        expect(record.superseded_compensation_version_ids).not_to include(original.id)
        expect(CompensationVersion.history_requires_review?(employment)).to eq(!retired)
      end
    end
  end

  it "refreshes loaded terms after canceling a pending schedule" do
    travel_to(Time.utc(2026, 11, 5, 12)) do
      record.update!(private_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-10"))
      expect(record.current_salary.fetch("salary_amount")).to eq("1000.00")

      record.update!(private_details: salary)
    end

    travel_to(Time.utc(2026, 11, 11, 12)) do
      expect(record.current_salary.fetch("salary_amount")).to eq("1000.00")
    end
  end

  [false, true].each do |future_history|
    it "preserves a legacy undated salary as observed today with future-only history #{future_history}" do
      company.update!(timezone: "America/New_York")
      legacy = salary.merge("salary_effective_on" => nil)
      future = salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-20")
      travel_to(Time.utc(2026, 11, 16, 4, 30)) do
        record.update!(private_details: legacy)
        employment.compensation_versions.delete_all
        if future_history
          employment.compensation_versions.create!(effective_on: "2026-11-25",
            salary_details: salary.merge("salary_amount" => "2500.00", "salary_effective_on" => "2026-11-25"), reviewed_at: Time.current)
        end
        expect(record.current_salary).to eq(legacy)

        record.update!(private_details: future)

        observed = employment.compensation_versions.find_by!(effective_on: "2026-11-15")
        expect(observed.salary_details).to eq(legacy)
        expect(observed.reviewed_at).to be_nil
        expect(record.current_salary.values).to all(be_nil)
        observed.update!(reviewed_at: Time.current)
        employment.compensation_versions.reset
        expect(record.current_salary).to eq(legacy)
        expect(employment.compensation_versions.minimum(:effective_on)).to eq(Date.new(2026, 11, 15))
      end

      travel_to(Time.utc(2026, 11, 20, 4, 59)) do
        expect(record.current_salary).to eq(legacy)
      end
      travel_to(Time.utc(2026, 11, 20, 5)) do
        expect(record.current_salary).to eq(future)
      end
    end
  end

  it "preserves existing eligible history instead of snapshotting conflicting undated configured values" do
    travel_to(Time.utc(2026, 11, 15, 12)) do
      record.update!(private_details: salary.merge("salary_amount" => "123.00", "salary_effective_on" => nil))
      employment.compensation_versions.delete_all
      correction = salary.merge("salary_amount" => "1500.00")
      employment.compensation_versions.create!(effective_on: "2026-11-01", salary_details: correction, reviewed_at: Time.current)
      expect(record.current_salary).to eq(correction)

      record.update!(private_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-11-20"))

      expect(record.current_salary).to eq(correction)
    end
  end
end

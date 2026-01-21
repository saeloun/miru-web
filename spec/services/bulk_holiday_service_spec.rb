# frozen_string_literal: true

require "rails_helper"

RSpec.describe BulkHolidayService, type: :service do
  let(:year) { 2023 }
  let(:current_company) { create(:company) }
  let(:holiday_params) do
    {
      holiday: {
        year:,
        enable_optional_holidays: true,
        no_of_allowed_optional_holidays: 7,
        holiday_types: ["national", "optional"]
      },
      add_holiday_infos: [
        { name: "New Year", date: "2023-01-01", category: "national" },
        { name: "Christmas", date: "2023-12-25", category: "optional" }
      ],
      update_holiday_infos: [],
      remove_holiday_infos: []
    }
  end

  subject { described_class.new(year, holiday_params, current_company) }

  describe "#process" do
    context "when holiday does not exist" do
      it "creates a new holiday record" do
        expect { subject.process }.to change(Holiday, :count).by(1)
      end

      it "creates holiday info records" do
        expect { subject.process }.to change(HolidayInfo, :count).by(2)
      end

      it "returns true on success" do
        expect(subject.process).to be true
      end
    end

    context "when holiday already exists" do
      before { create(:holiday, year:, company: current_company) }

      it "does not create a new holiday record" do
        expect { subject.process }.not_to change(Holiday, :count)
      end

      it "creates holiday info records" do
        expect { subject.process }.to change(HolidayInfo, :count).by(2)
      end
    end

    context "when updating holiday info" do
      let(:holiday_params) do
        {
          holiday: {
            enable_optional_holidays: true,
            no_of_allowed_optional_holidays: 7,
            holiday_types: ["national", "optional"]
          },
          add_holiday_infos: [],
          update_holiday_infos: [
            { id: 1, name: "Updated Holiday", date: "2023-01-01", category: "national" }
          ],
          remove_holiday_infos: []
        }
      end

      it "updates holiday info" do
        create(:holiday, year:, company: current_company)
        create(:holiday_info, id: 1, holiday: current_company.holidays.first)

        expect { subject.process }.to change { current_company.holidays.first.holiday_infos.first.name }
          .to("Updated Holiday")
      end
    end

    context "when removing holiday info" do
      let(:holiday_params) do
        {
          holiday: {
            enable_optional_holidays: true,
            no_of_allowed_optional_holidays: 7,
            holiday_types: ["national", "optional"]
          },
          add_holiday_infos: [],
          update_holiday_infos: [],
          remove_holiday_infos: [1]
        }
      end

      it "removes holiday info" do
        holiday = create(:holiday, year:, company: current_company)
        holiday_info = create(:holiday_info, id: 1, holiday:)

        expect { subject.process }.to change { holiday_info.reload.discarded? }.from(false).to(true)
      end
    end

    context "when adding holiday info with invalid name format" do
      let(:holiday_params) do
        {
          holiday: {
            year:,
            enable_optional_holidays: true,
            no_of_allowed_optional_holidays: 7,
            holiday_types: ["national", "optional"]
          },
          add_holiday_infos: [
            { name: "Worker@Day!", date: "2023-05-01", category: "national" }
          ],
          update_holiday_infos: [],
          remove_holiday_infos: []
        }
      end

      it "returns false" do
        expect(subject.process).to be false
      end

      it "does not create holiday info" do
        expect { subject.process }.not_to change(HolidayInfo, :count)
      end

      it "populates errors with field-level details" do
        subject.process
        expect(subject.errors[:add_holiday_infos]).to have_key(0)
        expect(subject.errors[:add_holiday_infos][0][:name]).to be_present
      end
    end

    context "when updating holiday info with invalid name format" do
      let(:holiday_params) do
        {
          holiday: {
            enable_optional_holidays: true,
            no_of_allowed_optional_holidays: 7,
            holiday_types: ["national", "optional"]
          },
          add_holiday_infos: [],
          update_holiday_infos: [
            { id: 1, name: "Invalid@Name!", date: "2023-01-01", category: "national" }
          ],
          remove_holiday_infos: []
        }
      end

      it "returns false" do
        create(:holiday, year:, company: current_company)
        create(:holiday_info, id: 1, holiday: current_company.holidays.first)

        expect(subject.process).to be false
      end

      it "does not update holiday info" do
        create(:holiday, year:, company: current_company)
        holiday_info = create(:holiday_info, id: 1, name: "Original Name", holiday: current_company.holidays.first)

        subject.process
        expect(holiday_info.reload.name).to eq("Original Name")
      end

      it "populates errors with field-level details" do
        create(:holiday, year:, company: current_company)
        create(:holiday_info, id: 1, holiday: current_company.holidays.first)

        subject.process
        expect(subject.errors[:update_holiday_infos]).to have_key(0)
        expect(subject.errors[:update_holiday_infos][0][:name]).to be_present
      end
    end
  end
end

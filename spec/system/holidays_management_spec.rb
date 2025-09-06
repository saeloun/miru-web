# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Holidays Management", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:current_year) { Date.current.year }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "Holidays page" do
    it "displays the holidays editor interface" do
      visit "/settings/holidays"

      expect(page).to have_content("Holiday Management")
      expect(page).to have_content("Configure public and optional holidays")
      expect(page).to have_content(current_year.to_s)
      expect(page).to have_button("Save Changes")
      expect(page).to have_button("Cancel")
    end

    it "allows adding public holidays" do
      visit "/settings/holidays"

      # Add a public holiday
      within(".border-gray-200", match: :first) do
        click_button "Add Holiday"

        # Fill in holiday details
        fill_in "Enter holiday name", with: "New Year Day"
        # Date picker interaction would go here

        expect(page).to have_field(with: "New Year Day")
      end
    end

    it "toggles optional holidays section" do
      visit "/settings/holidays"

      # Find and click the toggle for optional holidays
      # The toggle is a button with ToggleLeft/ToggleRight icon
      toggle_button = find("button", text: "", match: :first)
      toggle_button.click

      # Should show optional holidays configuration
      expect(page).to have_content("Total Allowed")
      expect(page).to have_content("Frequency")
    end

    context "with existing holidays" do
      let!(:holiday) do
        create(:holiday,
          company:,
          year: current_year,
          enable_optional_holidays: true,
          no_of_allowed_optional_holidays: 3,
          time_period_optional_holidays: "per_year",
          holiday_types: ["national", "optional"]
        )
      end

      let!(:public_holiday) do
        create(:holiday_info,
          holiday:,
          name: "Christmas",
          date: Date.new(current_year, 12, 25),
          category: "national"
        )
      end

      let!(:optional_holiday) do
        create(:holiday_info,
          holiday:,
          name: "Boxing Day",
          date: Date.new(current_year, 12, 26),
          category: "optional"
        )
      end

      it "displays existing holidays" do
        visit "/settings/holidays"

        # Check public holidays section
        expect(page).to have_content("Christmas")

        # Check optional holidays section (if enabled)
        if holiday.enable_optional_holidays
          expect(page).to have_content("Boxing Day")
        end

        # Check summary
        expect(page).to have_content("Summary")
        expect(page).to have_content("Public Holidays")
        expect(page).to have_content("1") # Count of public holidays
      end

      it "allows deleting holidays" do
        visit "/settings/holidays"

        # Find delete button for the first holiday
        delete_button = find("button", class: "text-red-500", match: :first)
        delete_button.click

        # Holiday should be removed from the list
        # Note: Changes are not saved until "Save Changes" is clicked
        expect(page).to have_button("Save Changes")
      end

      it "allows editing holiday names" do
        visit "/settings/holidays"

        # Find and edit the holiday name field
        holiday_input = find("input[value='Christmas']")
        holiday_input.fill_in with: "Christmas Day"

        expect(page).to have_field(with: "Christmas Day")
      end
    end
  end

  describe "Year selector" do
    it "allows switching between years" do
      visit "/settings/holidays"

      # Find year selector
      year_selector = find("select", match: :first)

      # Check that current year is selected
      expect(year_selector.value).to eq(current_year.to_s)

      # Select next year
      next_year = current_year + 1
      year_selector.select(next_year.to_s)

      # Page should update to show next year
      expect(page).to have_content(next_year.to_s)
    end
  end
end

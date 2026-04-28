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

      expect(page).to have_content("Holiday Calendar")
      expect(page).to have_content("Public Holidays")
      expect(page).to have_content(current_year.to_s)
      expect(page).to have_button("Edit")
    end

    it "allows adding public holidays" do
      visit "/settings/holidays"

      click_button "Edit"
      click_button "Add Holiday"
      fill_in "Enter holiday name", with: "New Year Day"

      expect(page).to have_field(with: "New Year Day")
      expect(page).to have_button("Save Changes")
    end

    it "toggles optional holidays section" do
      visit "/settings/holidays"

      expect(page).to have_content("Optional Holidays")
      click_button "Optional Holidays"

      expect(page).not_to have_content("TOTAL ALLOWED")
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

      let!(:early_optional_holiday) do
        create(:holiday_info,
          holiday:,
          name: "Founders Choice Day",
          date: Date.new(current_year, 12, 24),
          category: "optional"
        )
      end

      it "displays existing holidays" do
        visit "/settings/holidays"

        expect(page).to have_content("Public Holidays", wait: 10)
        expect(page).to have_content("Optional Holidays", wait: 10)
        expect(page).to have_content("Allowed per Employee", wait: 10)
        expect(page).to have_content("Christmas", wait: 10)
      end

      it "allows deleting holidays" do
        visit "/settings/holidays"
        click_button "Edit"

        initial_inputs = all("input[value='Christmas']").count
        delete_buttons = all("button[aria-label='Delete holiday']")
        if delete_buttons.any?
          delete_buttons.first.click
        else
          all("button").find { |button| button.text.strip.empty? }&.click
        end

        expect(page).to have_button("Save Changes")
        expect(all("input[value='Christmas']").count).to be < initial_inputs
      end

      it "allows editing holiday names" do
        visit "/settings/holidays"
        click_button "Edit"

        # Find and edit the holiday name field
        holiday_input = find("input[value='Christmas']")
        holiday_input.fill_in with: "Christmas Day"

        expect(page).to have_field(with: "Christmas Day")
      end

      it "lists public holidays before optional holidays in the year view" do
        visit "/settings/holidays"

        click_button "Year At A Glance"
        calendar = find("[data-testid='holidays-calendar']", wait: 10)

        expect(calendar.text.index("Christmas")).to be < calendar.text.index(
          "Founders Choice Day"
        )
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

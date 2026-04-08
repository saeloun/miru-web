# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking CRUD", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "CRUD Client") }
  let(:project) { create(:project, client:, name: "CRUD Project") }

  before do
    create(:employment, company:, user:)
    create(:project_member, user:, project:)
    user.add_role(:admin, company)
    sign_in(user)
  end

  def open_add_entry_form
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    click_button "Add Entry"
    expect(page).to have_text(/saving to/i, wait: 10)
  end

  def open_week_review
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    find("button[data-view='week']", wait: 10).click
    expect(page).to have_css(".week-view[data-view='week']", wait: 10)
    find("[data-testid='time-review-week']", wait: 10).click
  end

  def find_entry_card(note)
    find(:xpath, "//*[contains(@class,'group')][.//*[contains(normalize-space(.), #{note.to_json})]]", wait: 10)
  end

  def select_radix(label, value)
    field = find("label", text: label, exact_text: true, wait: 10)
      .find(:xpath, "./ancestor::div[contains(@class, 'space-y-2')][1]")

    field.find("[role='combobox']", wait: 10).click
    expect(page).to have_css("[role='listbox']", wait: 10)
    find("[role='option']", text: value, match: :first, wait: 10).click
    expect(field.find("[role='combobox']", wait: 10)).to have_text(value, wait: 10)
  end

  it "creates, edits, and deletes a time entry with persisted state after reload" do
    with_forgery_protection do
      open_add_entry_form

      select_radix("Client", client.name)
      select_radix("Project", project.name)
      fill_in "timeInput", with: "01:30"
      fill_in "notes", with: "Created through CRUD system spec"

      expect do
        click_button "Save Entry"
        expect(page).to have_button("Add Entry", wait: 10)
      end.to change {
        TimesheetEntry.where(
          user:,
          project:,
          note: "Created through CRUD system spec"
        ).count
      }.by(1)

      entry = TimesheetEntry.find_by!(
        user:,
        project:,
        note: "Created through CRUD system spec"
      )

      visit "/time-tracking"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_text("Created through CRUD system spec", wait: 10)

      entry_card = find_entry_card("Created through CRUD system spec")
      entry_card.hover
      within(entry_card) do
        first("button[title='Edit entry']", wait: 10).click
      end

      expect(page).to have_field("notes", with: "Created through CRUD system spec", wait: 10)
      fill_in "timeInput", with: "02:15"
      fill_in "notes", with: "Edited through CRUD system spec"
      click_button "Update Entry"

      entry.reload
      expect(entry.note).to eq("Edited through CRUD system spec")
      expect(entry.duration).to eq(135)

      open_week_review
      expect(page).to have_text("Edited through CRUD system spec", wait: 10)

      expect do
        entry_card = find_entry_card("Edited through CRUD system spec")
        entry_card.hover
        within(entry_card) do
          first("button[title='Delete entry']", wait: 10).click
        end
        expect(page).to have_css("#react-root", wait: 10)
      end.not_to change {
        TimesheetEntry.count
      }

      visit "/time-tracking"
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).not_to have_text("Edited through CRUD system spec")
      expect(entry.reload).to be_discarded
    end
  end
end

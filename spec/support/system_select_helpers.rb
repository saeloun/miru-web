# frozen_string_literal: true

module SystemSelectHelpers
  def combobox_for(label)
    label_node = find("label", text: label, exact_text: true, wait: 10)

    within(label_node.find(:xpath, "./ancestor::div[contains(@class, 'space-y-2')][1]")) do
      find("[role='combobox']", wait: 10)
    end
  end

  def select_radix(label, value)
    combobox_for(label).click
    expect(page).to have_css("[role='listbox']", wait: 10)
    find("[role='option']", text: value, match: :first, wait: 10).click
    expect(combobox_for(label)).to have_text(value, wait: 10)
  end
end

RSpec.configure do |config|
  config.include SystemSelectHelpers, type: :system
end

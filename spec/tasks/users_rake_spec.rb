# frozen_string_literal: true

require "rails_helper"
require "rake"

RSpec.describe "users:backfill_locales" do
  before(:all) do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
  end

  before do
    Rake::Task["users:backfill_locales"].reenable
  end

  it "normalizes invalid and non-canonical locales to supported values" do
    invalid_user = create(:user)
    non_canonical_user = create(:user)
    valid_user = create(:user, locale: "hi")

    invalid_user.update_columns(locale: "en-IN")
    non_canonical_user.update_columns(locale: "EN-us")

    expect {
      Rake::Task["users:backfill_locales"].invoke
    }.to output(/scanned=3 updated=2 already_valid=1/).to_stdout

    expect(invalid_user.reload.locale).to eq("en")
    expect(non_canonical_user.reload.locale).to eq("en-US")
    expect(valid_user.reload.locale).to eq("hi")
  end
end

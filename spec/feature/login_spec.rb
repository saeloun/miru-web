# frozen_string_literal: true

require "rails_helper"

describe "the signin process" do
  # let!(:user) { create(:user) }

  it "signs me in" do
    visit "/users/sign_in"
  end
end

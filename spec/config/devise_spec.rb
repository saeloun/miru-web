# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devise configuration" do
  it "limits unconfirmed access to three days" do
    expect(Devise.allow_unconfirmed_access_for).to eq(3.days)
  end

  it "locks accounts after repeated failed attempts" do
    expect(Devise.lock_strategy).to eq(:failed_attempts)
    expect(Devise.maximum_attempts).to eq(10)
    expect(Devise.unlock_strategy).to eq(:time)
    expect(Devise.unlock_in).to eq(30.minutes)
  end
end

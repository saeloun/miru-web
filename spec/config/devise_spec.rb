# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devise configuration" do
  it "limits unconfirmed access to three days" do
    expect(Devise.allow_unconfirmed_access_for).to eq(3.days)
  end
end

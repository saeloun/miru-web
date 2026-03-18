# frozen_string_literal: true

require "rails_helper"

RSpec.describe "FactoryBot lint" do
  it "builds all factories" do
    expect { FactoryBot.lint }.not_to raise_error
  end
end

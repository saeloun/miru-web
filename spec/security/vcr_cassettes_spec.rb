# frozen_string_literal: true

require "rails_helper"

RSpec.describe "VCR cassette secrets" do
  it "does not retain bearer credentials" do
    cassettes = Rails.root.glob("spec/cassettes/**/*.yml")
    exposed = cassettes.select { |path| path.read.match?(/Bearer\s+\S+/) }

    expect(exposed).to be_empty
  end
end

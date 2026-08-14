# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Production seeds" do
  it "fails before creating accounts in production" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))

    expect { load Rails.root.join("db/seeds.rb") }.to raise_error(SystemExit, "Demo seeds are disabled in production.")
  end

  it "does not run seeds during deployment" do
    expect(Rails.root.join("bin/deploy-hetzner").read).not_to include("db:seed")
  end

  it "does not print the configured password" do
    expect(Rails.root.join("db/seeds.rb").read).not_to match(/puts.*PASSWORD/)
  end
end

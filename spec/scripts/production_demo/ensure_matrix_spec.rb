# frozen_string_literal: true

require "rails_helper"

RSpec.describe "production demo matrix" do
  it "requires an explicit password" do
    password = ENV.delete("DEMO_MATRIX_PASSWORD")

    expect {
      load Rails.root.join("script/production_demo/ensure_matrix.rb")
    }.to raise_error(KeyError, /DEMO_MATRIX_PASSWORD/)
  ensure
    ENV["DEMO_MATRIX_PASSWORD"] = password if password
  end
end

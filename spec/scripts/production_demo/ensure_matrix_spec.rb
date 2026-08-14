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

  it "hashes the demo password before saving users" do
    original_password = ENV["DEMO_MATRIX_PASSWORD"]
    ENV["DEMO_MATRIX_PASSWORD"] = "Demo password 123!"
    create(:company, name: "Saeloun Inc")

    expect {
      load Rails.root.join("script/production_demo/ensure_matrix.rb")
    }.to output.to_stdout

    user = User.find_by!(email: "vipul@saeloun.com")
    expect(user).to be_valid_password("Demo password 123!")
    expect(user.encrypted_password).not_to include("Demo password 123!")
  ensure
    ENV["DEMO_MATRIX_PASSWORD"] = original_password
  end
end

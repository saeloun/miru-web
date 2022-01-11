# frozen_string_literal: true

require "rails_helper"

RSpec.describe Client, type: :model do
  let(:client) { build(:client) }

  it "is valid with valid attributes" do
    expect(client).to be_valid
  end

  it "is not valid without a name" do
    client.name = nil
    expect(client).to_not be_valid
  end

  it "is not valid without an email" do
    client.email = nil
    expect(client).to_not be_valid
  end

  it "is not valid without a invalid email" do
    client.email = "invalid_email"
    expect(client).to_not be_valid
  end

  it "is not valid if email is not unique" do
    client.save
    client2 = build(:client, email: client.email)
    expect(client2).to_not be_valid
  end
end

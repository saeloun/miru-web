# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  let(:user) { build(:user) }

  it "is valid with valid attributes" do
    expect(user).to be_valid
  end

  it "checks if it is an admin" do
    user.role = 0
    expect(user).to be_admin
  end

  it "checks if it is an employee" do
    user.role = 1
    expect(user).to be_employee
  end

  context "checking the presence of each attribute" do
    it "is not valid without a first_name" do
      user.first_name = nil
      expect(user).to_not be_valid
    end

    it "is not valid without a last name" do
      user.last_name = nil
      expect(user).to_not be_valid
    end

    it "is not valid without an email" do
      user.email = nil
      expect(user).to_not be_valid
    end

    it "is not valid without a password" do
      user.password = nil
      expect(user).to_not be_valid
    end
  end

  context "checking the length validations" do
    it "is not valid if the length of first_name is above 50 chars" do
      user.first_name = "j" * 55
      expect(user).to_not be_valid
    end

    it "is valid if the length of first_name is below 50 chars" do
      user.first_name = "j" * 45
      expect(user).to be_valid
    end

    it "is not valid if the length of last_name is above 50 chars" do
      user.last_name = "j" * 55
      expect(user).to_not be_valid
    end

    it "is valid if the length of last_name is below 50 chars" do
      user.last_name = "j" * 45
      expect(user).to be_valid
    end

    it "is not valid if the password length is below 6 characters" do
      user.password = "j" * 5
      expect(user).to_not be_valid
    end

    it "is valid if the password length is 6 characters or above" do
      user.password = "j" * 6
      expect(user).to be_valid
      user.password = "j" * 7
      expect(user).to be_valid
    end
  end

  context "email validations" do
    it "is valid if it is a valid email" do
      user.email = "judis@saeloun.com"
      expect(user).to be_valid
    end

    it "is not valid if email is invalid" do
      user.email = "judis@com"
      expect(user).to_not be_valid
    end
  end
end

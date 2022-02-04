# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  let(:user) { build(:user) }

  describe "Associations" do
    it { is_expected.to have_many(:identities).dependent(:delete_all) }
  end

  it "is valid with valid attributes" do
    expect(user).to be_valid
  end

  it "checks if it is an owner" do
    user.add_role :owner
    expect(user.has_role?(:owner)).to be_truthy
  end

  it "checks if it is an admin" do
    user.add_role :admin
    expect(user.has_role?(:admin)).to be_truthy
  end

  it "checks if it is an employee" do
    user.add_role :employee
    expect(user.has_role?(:employee)).to be_truthy
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

  context "checking first and last name validations" do
    it "is not valid if first_name contains chars other than letters" do
      user.first_name = "first1_#%#$^&"
      expect(user).to_not be_valid
    end

    it "is not valid if last_name contains chars other than letters" do
      user.last_name = "last1*!@$)^#$*&@'"
      expect(user).to_not be_valid
    end

    it "is valid if first_name contains spaces" do
      user.first_name = "foo bar"
      expect(user).to be_valid
    end

    it "is valid if last_name contains spaces" do
      user.last_name = "foo bar"
      expect(user).to be_valid
    end

    it "is not valid if first_name is blank" do
      user.first_name = ""
      expect(user).to_not be_valid
      user.first_name = "    "
      expect(user).to_not be_valid
    end

    it "is not valid if last_name is blank" do
      user.last_name = ""
      expect(user).to_not be_valid
      user.last_name = "    "
      expect(user).to_not be_valid
    end
  end

  context "email validations" do
    it "is not valid if email is invalid" do
      user.email = "judis@com"
      expect(user).to_not be_valid
    end

    it "is valid if it is a valid email" do
      user.email = "judis@saeloun.com"
      expect(user).to be_valid
    end

    it "is not valid if email is not unique" do
      user.email = "judis@saeloun.com"
      user.save
      user2 = build(:user, email: user.email)
      expect(user2).to_not be_valid
    end
  end
end

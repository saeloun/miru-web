# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  let(:user) { build(:user) }

  describe "Associations" do
    it { is_expected.to belong_to(:company).optional }
    it { is_expected.to have_many(:identities).dependent(:delete_all) }
    it { is_expected.to have_many(:project_members).dependent(:destroy) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to have_one_attached(:avatar) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to allow_value("foo").for(:first_name) }
    it { is_expected.to_not allow_value("foo&23423").for(:first_name) }
    it { is_expected.to allow_value("foo").for(:last_name) }
    it { is_expected.to_not allow_value("foo&23423").for(:last_name) }
    it { is_expected.to validate_length_of(:first_name).is_at_most(50) }
    it { is_expected.to validate_length_of(:last_name).is_at_most(50) }
  end

  describe "Callbacks" do
    it { is_expected.to callback(:discard_project_members).after(:discard) }
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

  describe "#primary_role" do
    it "shows the first role name" do
      user.add_role :admin
      user.add_role :owner
      expect(user.primary_role).to eq("admin")
      expect(user.primary_role).not_to eq("owner")
    end
  end

  describe "#full_name" do
    it "shows the full name of user" do
      user.first_name = "First"
      user.last_name = "Last"
      expect(user.full_name).to eq("First Last")
    end
  end

  describe "#admin?" do
    it "returns true if user has admin role or owner role" do
      user.add_role :admin
      expect(user.admin?).to be_truthy
    end

    it "returns false if user does not have admin role or owner role" do
      expect(user.admin?).not_to be_truthy
    end
  end

  describe "#active_for_authentication?" do
    context "when user is an admin/owner" do
      before { user.add_role :admin }

      it "returns true if user is not discarded" do
        expect(user.active_for_authentication?).to be_truthy
      end

      it "returns false if user is discarded" do
        user.discard!
        expect(user.active_for_authentication?).not_to be_truthy
      end
    end

    context "when user is not an admin/owner" do
      before { user.remove_role :admin }

      it "returns true if user is not discarded" do
        expect(user.active_for_authentication?).to be_truthy
      end

      it "returns false if user is discarded" do
        user.discard!
        expect(user.active_for_authentication?).not_to be_truthy
      end
    end
  end
end

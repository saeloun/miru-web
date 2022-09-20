# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationHelper, type: :helper do
  describe ".user_avatar" do
    context "when user avatar is attached" do
      let(:user) { create(:user, :with_avatar) }

      it "returns user's avatar" do
        expect(helper.user_avatar(user)).to eq(url_for(user.avatar))
      end
    end

    context "when user avatar is not attached" do
      let(:user) { create(:user) }

      it "returns user's avatar" do
        expect(helper.user_avatar(user)).to include("/assets/avatar")
      end
    end
  end

  describe ".company_logo" do
    context "when company logo is attached" do
      let(:company) { create(:company, :with_logo) }

      it "returns company's logo" do
        expect(helper.company_logo(company)).to eq(company.logo)
      end
    end

    context "when company logo is not attached" do
      let(:company) { create(:company) }

      it "returns company's logo" do
        expect(helper.company_logo(company)).to include("/assets/company")
      end
    end
  end

  describe ".error_message_on" do
    let(:resource) { create(:user) }

    context "when resource doesn't have errors on the attribute" do
      it "returns nil" do
        attribute = resource.first_name
        expect(helper.error_message_on(resource, attribute)).to be_nil
      end
    end

    context "when resource have errors on the attribute" do
      before do
        resource.errors.add(:first_name, "Custom error")
      end

      it "returns the error" do
        attribute = :first_name
        expect(helper.error_message_on(resource, attribute)).to eq("Custom error")
      end
    end
  end

  describe ".error_message_class" do
    let(:resource) { create(:user) }

    context "when resource does not have errors on the attribute" do
      it "returns error class for no errors" do
        attribute = :first_name
        no_error_class = "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
        expect(helper.error_message_class(resource, attribute)).to eq(no_error_class)
      end
    end

    context "when resource have errors on the attribute" do
      before do
        resource.errors.add(:first_name, "Custom error")
      end

      it "returns different error class" do
        attribute = :first_name
        error_class = "border-red-600 focus:ring-red-600 focus:border-red-600"
        expect(helper.error_message_class(resource, attribute)).to eq(error_class)
      end
    end
  end
end

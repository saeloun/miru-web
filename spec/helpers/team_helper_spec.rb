# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamHelper, type: :helper do
  describe ".resource_name" do
    it "returns resource_name as :user" do
      expect(helper.resource_name).to eq(:user)
    end
  end

  describe ".resource" do
    it "returns an instance of User class" do
      expect(helper.resource).to be_instance_of(User)
    end
  end

  describe ".devise_mapping" do
    it "returns an devise mappings of :user" do
      expect(helper.devise_mapping).to be_instance_of(Devise::Mapping)
      expect(helper.devise_mapping.class_name).to eq("User")
    end
  end
end

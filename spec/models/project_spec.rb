# frozen_string_literal: true

require "rails_helper"

RSpec.describe Project, type: :model do
  let(:project) { build(:project) }

  it "is valid with valid attributes" do
    expect(project).to be_valid
  end

  it "is not valid without a name" do
    project.name = nil
    expect(project).to_not be_valid
  end

  it "is not valid without a description" do
    project.description = nil
    expect(project).to_not be_valid
  end

  it "is not valid without a bill_status" do
    project.bill_status = nil
    expect(project).to_not be_valid
  end
end

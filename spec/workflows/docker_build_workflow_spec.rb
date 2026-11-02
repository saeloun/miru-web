# frozen_string_literal: true

require "rails_helper"
require "yaml"

RSpec.describe "Docker build workflow" do
  let(:source) { Rails.root.join(".github/workflows/docker-build.yml").read }
  let(:workflow) { YAML.safe_load(source, aliases: true) }
  let(:steps) { workflow.fetch("jobs").fetch("build-and-push").fetch("steps") }

  it "still builds images on pushes to production" do
    expect(workflow.fetch(true).fetch("push").fetch("branches")).to include("production")
    expect(steps.map { |step| step["name"] }).to include("Build and push production image")
  end

  it "never asks Render to deploy" do
    expect(source).not_to match(/render/i)
    expect(steps.filter_map { |step| step["run"] }.join("\n")).not_to include("/deploys")
  end
end

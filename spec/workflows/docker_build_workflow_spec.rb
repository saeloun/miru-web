# frozen_string_literal: true

require "yaml"

RSpec.describe "Docker build workflow" do
  let(:workflow) do
    YAML.safe_load(File.read(File.expand_path("../../.github/workflows/docker-build.yml", __dir__)), aliases: true)
  end
  let(:steps) { workflow.fetch("jobs").fetch("build-and-push").fetch("steps") }

  it "keeps production image builds and pushes" do
    expect(workflow.fetch(true).fetch("push").fetch("branches")).to include("production")
    build = steps.find { |step| step["name"] == "Build and push production image" }

    expect(build.fetch("uses")).to start_with("docker/build-push-action@")
    expect(build.fetch("with")).to include("target" => "production", "platforms" => "linux/amd64",
      "push" => "${{ github.event_name != 'pull_request' }}")
  end

  it "has no Render deployment credentials or API calls" do
    expect(workflow.to_s).not_to match(/render/i)
  end
end

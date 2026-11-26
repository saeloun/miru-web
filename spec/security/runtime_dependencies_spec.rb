# frozen_string_literal: true

require "spec_helper"

RSpec.describe "Runtime dependency security" do
  let(:root) { File.expand_path("../..", __dir__) }

  it "keeps local, container, deployment and CI Ruby pins consistent" do
    version = File.read(File.join(root, ".ruby-version")).strip
    expect(RUBY_VERSION).to eq(version)
    expect(Gem::Version.new(version)).to be >= Gem::Version.new("4.0.10")
    paths = %w[Gemfile mise.toml config/deploy.yml config/deploy.kamal.yml
      .github/workflows/validations.yml .github/workflows/reek.yml .github/workflows/docker-build.yml]
    paths += Dir.glob("Dockerfile*", base: root)
    paths.each do |path|
      versions = File.read(File.join(root, path)).scan(
        /(?:RUBY_VERSION[=:]\s*|ruby-version:\s*|^\s*ruby(?:\s*=\s*|\s+))["']?(\d+\.\d+\.\d+)/).flatten.uniq
      expect(versions).to eq([version]), path
    end
  end

  it "loads patched SSH, web server and request protection dependencies" do
    { "net-ssh" => "7.3.10", "puma" => "7.2.3", "rack-protection" => "4.2.2" }.each do |name, minimum|
      expect(Gem.loaded_specs.fetch(name).version).to be >= Gem::Version.new(minimum)
    end
    expect(Gem.loaded_specs.fetch("net-ssh").version).to be < Gem::Version.new("8")
  end
end

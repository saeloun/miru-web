# frozen_string_literal: true

require "spec_helper"
require "fileutils"
require "json"
require "open3"
require "rbconfig"
require "tmpdir"

RSpec.describe "enforce_council_gate.sh" do
  let(:root) { File.expand_path("../..", __dir__) }
  let(:head) { "a" * 40 }
  let(:required) { %w[plan-eng-review plan-design-review plan-devex-review] }

  around do |example|
    Dir.mktmpdir("miru-council-") do |directory|
      @directory = directory
      @commands = File.join(directory, "bin")
      @state = File.join(directory, "state")
      FileUtils.mkdir_p([@commands, File.join(@state, "projects", "synthetic")])
      write_command("gstack-slug", "printf 'SLUG=synthetic\\nBRANCH=branch\\n'\n")
      write_command("git", <<~SH)
        case "$*" in
          "rev-parse --show-toplevel") pwd ;;
          "rev-parse HEAD") echo #{head} ;;
          "rev-parse --short HEAD") echo #{head[0, 7]} ;;
          *) exit 1 ;;
        esac
      SH
      example.run
    end
  end

  def write_command(name, body)
    path = File.join(@commands, name)
    File.write(path, "#!/bin/sh\n#{body}")
    File.chmod(0o755, path)
  end

  def review(skill, status, commit = head)
    { skill:, status:, commit_full: commit }
  end

  def clean_reviews
    required.map { |skill| review(skill, "clean") }
  end

  def run_gate(rows)
    File.write(File.join(@state, "projects", "synthetic", "branch-reviews.jsonl"), rows.map(&:to_json).join("\n"))
    environment = { "GSTACK_BIN" => @commands, "GSTACK_HOME" => @state,
                    "PATH" => [@commands, File.dirname(RbConfig.ruby), "/usr/bin", "/bin"].join(":") }
    Open3.capture3(environment, "/bin/bash", File.join(root, "script/enforce_council_gate.sh"),
      chdir: @directory, unsetenv_others: true)
  end

  it "accepts all required clean or clear reviews" do
    rows = required.zip(%w[clean clear CLEAN]).map { |skill, status| review(skill, status) }
    output, errors, status = run_gate(rows)

    expect(status).to be_success, output + errors
    expect(output).to include("Council gate passed")
  end

  %w[plan-eng-review plan-design-review plan-devex-review].each do |skill|
    it "rejects a newer failed #{skill} even when an older review is clean" do
      output, errors, status = run_gate(clean_reviews + [review(skill, "issues_open")])

      expect(status).not_to be_success, output + errors
      expect(output).to include("#{skill}=missing")
    end
  end

  it "accepts a later clear review after a failure" do
    rows = clean_reviews + [review("plan-eng-review", "issues_open"), review("plan-eng-review", "clear")]
    output, errors, status = run_gate(rows)

    expect(status).to be_success, output + errors
  end

  it "ignores a newer review for another commit" do
    output, errors, status = run_gate(clean_reviews + [review("plan-design-review", "issues_open", "b" * 40)])

    expect(status).to be_success, output + errors
  end

  it "rejects a missing required review" do
    output, errors, status = run_gate(clean_reviews.drop(1))

    expect(status).not_to be_success, output + errors
    expect(output).to include("plan-eng-review=missing")
  end
end

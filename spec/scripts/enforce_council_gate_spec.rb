# frozen_string_literal: true

require "spec_helper"
require "fileutils"
require "json"
require "open3"
require "rbconfig"
require "shellwords"
require "tmpdir"
require "yaml"

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

  def run_gate(rows, updates: nil)
    File.write(File.join(@state, "projects", "synthetic", "branch-reviews.jsonl"), rows.map(&:to_json).join("\n"))
    environment = { "GSTACK_BIN" => @commands, "GSTACK_HOME" => @state,
                    "PATH" => [@commands, File.dirname(RbConfig.ruby), "/usr/bin", "/bin"].join(":") }
    arguments = ["/bin/bash", File.join(root, "script/enforce_council_gate.sh")]
    if updates
      hook = YAML.safe_load_file(File.join(root, "lefthook.yml")).fetch("pre-push").fetch("commands").fetch("council-gate")
      expect(hook.fetch("use_stdin")).to be(true)
      command = Shellwords.split(hook.fetch("run"))
      arguments = ["/bin/bash", File.join(root, command.first), *command.drop(1)]
    end
    Open3.capture3(environment, *arguments, stdin_data: updates.to_s, chdir: @directory, unsetenv_others: true)
  end

  it "accepts all required clean or clear reviews" do
    rows = required.zip(%w[clean clear CLEAN]).map { |skill, status| review(skill, status) }
    rows.first[:commit_full] = head[0, 7]
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

  ["b" * 40, "a" * 7 + "b" * 33].each do |other_commit|
    it "ignores a newer review for another commit #{other_commit}" do
      output, errors, status = run_gate(clean_reviews + [review("plan-design-review", "issues_open", other_commit)])

      expect(status).to be_success, output + errors
    end
  end

  it "does not accept another commit sharing HEAD's short prefix" do
    rows = clean_reviews.drop(1) + [review("plan-eng-review", "clean", "a" * 7 + "b" * 33)]
    output, errors, status = run_gate(rows)

    expect(status).not_to be_success, output + errors
  end

  it "accepts a pre-push update of the checked-out commit" do
    output, errors, status = run_gate(clean_reviews,
      updates: "refs/heads/branch #{head} refs/heads/branch #{'b' * 40}\n")

    expect(status).to be_success, output + errors
  end

  it "rejects a pre-push update of a different commit despite clean HEAD reviews" do
    output, errors, status = run_gate(clean_reviews,
      updates: "refs/heads/other #{'b' * 40} refs/heads/other #{'c' * 40}\n")

    expect(status).not_to be_success, output + errors
  end

  it "checks every pushed update" do
    updates = "refs/heads/branch #{head} refs/heads/branch #{'b' * 40}\n" \
      "refs/heads/other #{'b' * 40} refs/heads/other #{'c' * 40}\n"
    output, errors, status = run_gate(clean_reviews, updates:)

    expect(status).not_to be_success, output + errors
  end

  it "does not treat branch deletion as a pushed commit" do
    output, errors, status = run_gate(clean_reviews,
      updates: "(delete) #{'0' * 40} refs/heads/old #{'b' * 40}\n")

    expect(status).to be_success, output + errors
  end

  it "rejects a missing required review" do
    output, errors, status = run_gate(clean_reviews.drop(1))

    expect(status).not_to be_success, output + errors
    expect(output).to include("plan-eng-review=missing")
  end

  describe "explicit no-UI design applicability" do
    let(:design_applicability) do
      review("plan-design-review", "not_applicable").merge(
        applicability: "no_ui_scope", applicability_complete: true, ui_review_completed: false, unresolved: 0
      )
    end

    it "accepts only complete typed no-UI design applicability at the exact full HEAD" do
      rows = clean_reviews.reject { |row| row[:skill] == "plan-design-review" } + [design_applicability]
      output, errors, status = run_gate(rows)

      expect(status).to be_success, output + errors
    end

    it "rejects bare not_applicable status" do
      output, errors, status = run_gate(clean_reviews + [review("plan-design-review", "not_applicable")])

      expect(status).not_to be_success, output + errors
    end

    [
      [:applicability, "unknown"], [:applicability_complete, "true"], [:applicability_complete, false],
      [:ui_review_completed, "false"], [:ui_review_completed, true],
      [:unresolved, "0"], [:unresolved, 0.0], [:unresolved, 1], [:commit_full, "a" * 7]
    ].each do |field, value|
      it "rejects malformed no-UI evidence #{field}=#{value.inspect}" do
        output, errors, status = run_gate(clean_reviews + [design_applicability.merge(field => value)])

        expect(status).not_to be_success, output + errors
      end
    end

    %w[plan-eng-review plan-devex-review].each do |skill|
      it "does not waive #{skill} using no-UI design fields" do
        output, errors, status = run_gate(clean_reviews + [design_applicability.merge(skill:)])

        expect(status).not_to be_success, output + errors
      end
    end

    it "rejects a later failure after complete no-UI design applicability" do
      rows = clean_reviews + [design_applicability, review("plan-design-review", "issues_open")]
      output, errors, status = run_gate(rows)

      expect(status).not_to be_success, output + errors
    end
  end
end

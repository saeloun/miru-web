# frozen_string_literal: true

require "spec_helper"
require "cgi"
require "json"
require "open3"
require "set"
require "tmpdir"
require "uri"
require "yaml"

RSpec.describe "Documenso functional QA isolation" do
  let(:root) { File.expand_path("../..", __dir__) }

  it "passes the offline lifecycle and private evidence regression checks" do
    output, errors, status = Open3.capture3({ "PATH" => ENV.fetch("PATH") },
      "python3", "-I", "-B", File.join(root, "scripts/ci/documenso_functional_qa.py"), "--self-check",
      chdir: root, unsetenv_others: true)

    expect(status).to be_success, output + errors
    expect(output).to include("Offline lifecycle checks passed")
  end

  it "always cleans up the runtime and publishes only the sanitized evidence directory" do
    workflow = YAML.safe_load_file(File.join(root, ".github/workflows/documenso-build.yml"))
    steps = workflow.fetch("jobs").fetch("functional-qa").fetch("steps")
    cleanup = steps.select { |step| step.fetch("run", "").include?("--cleanup --work") }
    artifacts = steps.select { |step| step.fetch("uses", "").start_with?("actions/upload-artifact@") }

    expect(cleanup.size).to eq(1)
    expect(cleanup.first.fetch("if")).to eq("always()")
    expect(artifacts.size).to eq(1)
    expect(artifacts.first.fetch("if")).to eq("always()")
    expect(artifacts.first.fetch("with").fetch("path")).to eq("${{ env.MIRU_QA_WORK }}/evidence/")
  end

  it "matches the pinned confirmation email through the actual fixture mailbox controls" do
    # Extract helpers without loading the live fixture or its guarded runtime.
    path = File.join(root, "scripts/ci/documenso_live_provider_spec.rb")
    source = File.read(path, encoding: "UTF-8")
    nodes = []
    visit = lambda do |node|
      next unless node.is_a?(RubyVM::AbstractSyntaxTree::Node)

      nodes << node
      node.children.each { |child| visit.call(child) }
    end
    visit.call(RubyVM::AbstractSyntaxTree.parse(source))
    definition = ->(node) { source.lines[(node.first_lineno - 1)..(node.last_lineno - 1)].join }
    fixture = Module.new
    stub_const("DocumensoLive", fixture)
    nodes.select { |node| node.type == :DEFS && %i[check message_link].include?(node.children[1]) }.each do |node|
      fixture.module_eval(definition.call(node), path, node.first_lineno)
    end
    matcher_class = Class.new
    nodes.select { |node| node.type == :DEFN && %i[mailbox mail_to local_get wait_for].include?(node.children.first) }.each do |node|
      matcher_class.class_eval(definition.call(node), path, node.first_lineno)
    end
    matcher_class.define_method(:check) { |condition, reason| fixture.check(condition, reason) }
    account = nodes.find { |node| node.type == :DEFN && node.children.first == :provider_account }
    account_nodes = nodes.select { |node| node.first_lineno.between?(account.first_lineno, account.last_lineno) }
    call = account_nodes.find { |node| node.type == :FCALL && node.children.first == :mail_to }
    subject = call.children[1].children.find { |node| node&.type == :REGX }.children.first
    link_call = account_nodes.find { |node| node.type == :CALL && node.children[1] == :message_link }
    token_path = link_call.children[2].children.find { |node| node&.type == :REGX }.children.first
    origin = "http://127.0.0.1:4000"
    email = "provider@miru-qa.invalid"
    link = "#{origin}/verify-email/fresh"
    message = { "ID" => "fresh", "Subject" => "Please confirm your email", "To" => [{ "Address" => email }] }
    cases = [
      ["valid confirmation", {}, link, link],
      ["wrong subject", { "Subject" => "Please verify your email" }, link, nil],
      ["prefixed subject", { "Subject" => "Re: Please confirm your email" }, link, nil],
      ["suffixed subject", { "Subject" => "Please confirm your email\nOther subject" }, link, nil],
      ["wrong recipient", { "To" => [{ "Address" => "other@miru-qa.invalid" }] }, link, nil],
      ["earlier message", { "ID" => "earlier" }, link, nil],
      ["used message", { "ID" => "used" }, link, nil],
      ["foreign origin", {}, "http://example.invalid:4000/verify-email/fresh", nil],
      ["wrong token path", {}, "#{link}/complete", nil]
    ]
    cases.each do |label, changes, candidate, expected|
      matcher = matcher_class.new
      matcher.instance_variable_set(:@config, { "mailpit_origin" => origin })
      matcher.instance_variable_set(:@used_mail, Set["used"])
      allow(matcher).to receive(:wait_for) { |_reason, &block| block.call }
      allow(matcher).to receive(:local_get) do |url|
        body = URI(url).path == "/api/v1/search" ? { "messages" => [message.merge(changes)] } : { "Text" => candidate }
        [Struct.new(:code).new("200"), JSON.generate(body)]
      end
      result = matcher.mail_to(email, subject, Set["earlier"]) do |body|
        fixture.message_link(body, origin, token_path)
      end
      aggregate_failures(label) do
        expect(result).to eq(expected)
        expect(matcher.instance_variable_get(:@used_mail)).to eq(expected ? Set["used", "fresh"] : Set["used"])
      end
    end
  end

  it "preserves isolated preload and pinned worker registration contracts" do
    prefix, errors, status = Open3.capture3("python3", "-I", "-B", "-c", <<~PYTHON, chdir: root)
      import ast, pathlib
      tree = ast.parse(pathlib.Path("scripts/ci/documenso_functional_qa.py").read_text())
      preload = next(ast.literal_eval(node.value) for node in tree.body if isinstance(node, ast.Assign)
                     and any(isinstance(target, ast.Name) and target.id == "PRELOAD" for target in node.targets))
      print(preload.split("cfg = JSON.parse", 1)[0])
    PYTHON
    expect(status).to be_success, errors

    Dir.mktmpdir("signing-loader") do |directory|
      File.write(File.join(directory, "empty.env"), "")
      Dir.mkdir(File.join(directory, "tmp"))
      preload = File.join(directory, "preload.rb")
      File.write(preload, prefix + <<~RUBY)
        qa_env = File.join(__dir__, "empty.env")
        Dotenv::Railtie.prepend(Module.new do
          define_method(:dotenv_files) { [qa_env] }
          private :dotenv_files
        end)
        Dotenv.singleton_class.prepend(Module.new do
          %i[load overload].each do |method|
            define_method(method) do |*files, **options|
              raise "Unowned dotenv refused" unless files.any? && files.all? { |file| File.expand_path(file) == qa_env }
              super(*files, **options)
            end
          end
        end)
        require File.join(ENV.fetch("DOCUMENSO_LIVE_APP"), "config/application")
      RUBY
      fixture = File.join(directory, "loader_spec.rb")
      File.write(fixture, <<~RUBY)
        RSpec.describe "isolated public helper loader" do
          it("loads before Rails initialization") { expect(Rails.application.initialized?).to be(false) }

          it "matches the pinned fork supervisor registration kind" do
            source = File.read(#{File.join(root, "scripts/ci/documenso_live_provider_spec.rb").inspect}, encoding: "UTF-8")
            lookup = source.lines.find { |line| line.include?("supervisor = SolidQueue::Process.find_by") }
            expect(lookup[/kind: "([^"]+)"/, 1]).to eq(SolidQueue::Supervisor::ForkSupervisor.allocate.kind)
          end
        end
      RUBY
      output, errors, status = Open3.capture3(
        { "PATH" => "#{File.dirname(RbConfig.ruby)}:/usr/bin:/bin", "HOME" => directory, "RAILS_ENV" => "test", "CI" => "true",
          "BUNDLE_GEMFILE" => File.join(root, "Gemfile"), "DOCUMENSO_LIVE_APP" => root, "RUBYOPT" => "-r#{preload}" },
        RbConfig.ruby, Gem.bin_path("bundler", "bundle"), "exec", "rspec", "--options", File.join(root, ".rspec"),
        "-I", File.join(root, "spec"), fixture, "--no-color", chdir: directory, unsetenv_others: true)

      expect(status).to be_success, output + errors
      expect(output).to include("2 examples, 0 failures")
    end
  end
end

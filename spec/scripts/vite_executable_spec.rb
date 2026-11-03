# frozen_string_literal: true

require "spec_helper"
require "fileutils"
require "json"
require "open3"
require "rbconfig"
require "tmpdir"

RSpec.describe "Vite executable resolution" do
  let(:root) { File.expand_path("../..", __dir__) }

  around do |example|
    Dir.mktmpdir("miru vite-") do |directory|
      @project = directory
      FileUtils.cp_r(File.join(root, "bin"), directory)
      FileUtils.mkdir_p(File.join(directory, "config"))
      FileUtils.cp(Dir.glob(File.join(root, "config/vite.{json,rb}")), File.join(directory, "config"))
      File.write(File.join(directory, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n")
      FileUtils.mkdir_p(File.join(directory, "commands"))
      write_command("pnpm", "echo unexpected-package-manager > pnpm-called\nexit 42\n")
      example.run
    end
  end

  def write_command(name, body)
    path = File.join(@project, "commands", name)
    File.write(path, "#!/bin/sh\n#{body}")
    File.chmod(0o755, path)
  end

  def run_vite(*arguments, vite_root: @project, directory: @project)
    Open3.capture3(
      { "RACK_ENV" => "test", "VITE_RUBY_ROOT" => vite_root,
        "PATH" => "#{@project}/commands:#{ENV.fetch('PATH')}" },
      RbConfig.ruby, "-rvite_ruby", "-e", "ViteRuby.instance.run(ARGV, exec: true)", *arguments,
      chdir: directory
    )
  end

  it "fails with installation instructions before a package manager can resolve the Ruby vite shim" do
    _output, errors, status = run_vite("build")

    expect(status).not_to be_success
    expect(errors).to include("pnpm install --frozen-lockfile")
    expect(File.exist?(File.join(@project, "pnpm-called"))).to be(false)
  end

  it "preserves package-manager dispatch and Node options when dependencies are installed" do
    script = File.join(@project, "node_modules/.bin/vite")
    FileUtils.mkdir_p(File.dirname(script))
    File.write(script, "#!/bin/sh\nexit 0\n")
    File.chmod(0o755, script)
    write_command("pnpm", 'printf "%s\n" "$@" > pnpm-arguments' + "\n")

    node_options = '--node-options="--trace-deprecation"'
    _output, errors, status = run_vite("build", "--emptyOutDir", node_options)

    expect(status).to be_success, errors
    arguments = File.readlines(File.join(@project, "pnpm-arguments"), chomp: true)
    expect(arguments).to eq(["exec", node_options, "vite", "build", "--emptyOutDir", "--mode", "test"])
  end

  it "honors an explicitly configured executable without local dependencies" do
    write_command("custom-vite", 'printf "%s\n" "$@" > custom-arguments' + "\n")
    config = File.join(@project, "config/vite.json")
    settings = JSON.parse(File.read(config))
    settings["all"]["viteBinPath"] = "commands/custom-vite"
    File.write(config, JSON.generate(settings))

    _output, errors, status = run_vite("build")

    expect(status).to be_success, errors
    expect(File.readlines(File.join(@project, "custom-arguments"), chomp: true)).to eq(["build", "--mode", "test"])
    expect(File.exist?(File.join(@project, "pnpm-called"))).to be(false)
  end

  it "finds local dependencies when the project root is relative to the invoking directory" do
    script = File.join(@project, "node_modules/.bin/vite")
    FileUtils.mkdir_p(File.dirname(script))
    File.write(script, "#!/bin/sh\nexit 0\n")
    File.chmod(0o755, script)
    write_command("pnpm", "exit 0\n")

    _output, errors, status = run_vite("build", vite_root: File.basename(@project), directory: File.dirname(@project))

    expect(status).to be_success, errors
  end

  it "loads production asset configuration without requiring frontend dependencies" do
    _output, errors, status = Open3.capture3(
      { "RACK_ENV" => "production", "VITE_RUBY_ROOT" => @project },
      RbConfig.ruby, "-rvite_ruby", "-e", "ViteRuby.config.public_output_dir",
      chdir: @project
    )

    expect(status).to be_success, errors
  end

  it "explains an unusable configured executable even when local dependencies are available" do
    write_command("custom-vite", "exit 0\n")
    File.chmod(0o644, File.join(@project, "commands/custom-vite"))
    script = File.join(@project, "node_modules/.bin/vite")
    FileUtils.mkdir_p(File.dirname(script))
    File.write(script, "#!/bin/sh\nexit 0\n")
    File.chmod(0o755, script)
    config = File.join(@project, "config/vite.json")
    settings = JSON.parse(File.read(config))
    settings["all"]["viteBinPath"] = "commands/custom-vite"
    File.write(config, JSON.generate(settings))

    _output, errors, status = run_vite("build")

    expect(status).not_to be_success
    expect(errors).to include("Check viteBinPath: the configured Vite file is not executable")
    expect(File.exist?(File.join(@project, "pnpm-called"))).to be(false)
  end
end

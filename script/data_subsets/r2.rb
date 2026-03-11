# frozen_string_literal: true

require "fileutils"
require "open3"
require "tmpdir"

command = ARGV.fetch(0)
bucket = ENV.fetch("SANITIZED_SUBSET_R2_BUCKET", "miru-sanitized-subsets")
prefix = ENV.fetch("SANITIZED_SUBSET_R2_PREFIX", "miru/sanitized-subsets")
account_id = ENV.fetch("CLOUDFLARE_ACCOUNT_ID")
api_token = ENV.fetch("CLOUDFLARE_API_TOKEN")

def wrangler_env(account_id, api_token)
  cache_dir = ENV["NPM_CONFIG_CACHE"] || Dir.mktmpdir("miru-wrangler-cache-")
  config_home = ENV["XDG_CONFIG_HOME"] || Dir.mktmpdir("miru-wrangler-home-")
  {
    "CLOUDFLARE_ACCOUNT_ID" => account_id,
    "CLOUDFLARE_API_TOKEN" => api_token,
    "npm_config_cache" => cache_dir,
    "XDG_CONFIG_HOME" => config_home
  }
end

def run_wrangler!(env, *args)
  stdout, stderr, status = Open3.capture3(env, "mise", "exec", "--", "npx", "-y", "wrangler", *args)
  return stdout if status.success?

  abort([stdout, stderr].reject(&:empty?).join("\n"))
end

env = wrangler_env(account_id, api_token)

case command
when "upload"
  local_path = ARGV.fetch(1)
  basename = File.basename(local_path)
  latest_key = "#{prefix}/latest.dump"
  archive_key = "#{prefix}/#{basename}"

  run_wrangler!(env, "r2", "object", "put", "#{bucket}/#{archive_key}", "--file", local_path)
  run_wrangler!(env, "r2", "object", "put", "#{bucket}/#{latest_key}", "--file", local_path)
  puts latest_key
when "download-latest"
  target_path = ARGV.fetch(1)
  FileUtils.mkdir_p(File.dirname(target_path))
  latest_key = "#{prefix}/latest.dump"
  run_wrangler!(env, "r2", "object", "get", "#{bucket}/#{latest_key}", "--file", target_path)
  puts latest_key
else
  abort("Usage: script/data_subsets/r2.rb upload <file> | download-latest <target_path>")
end

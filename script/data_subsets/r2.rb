# frozen_string_literal: true

require "aws-sdk-s3"

command = ARGV.fetch(0)
bucket = ENV.fetch("CLOUDFLARE_R2_BUCKET_NAME")
endpoint = ENV.fetch("CLOUDFLARE_R2_ENDPOINT")
region = ENV.fetch("CLOUDFLARE_R2_REGION", "auto")
prefix = ENV.fetch("SANITIZED_SUBSET_R2_PREFIX", "miru/sanitized-subsets")

client = Aws::S3::Client.new(
  access_key_id: ENV.fetch("CLOUDFLARE_R2_ACCESS_KEY_ID"),
  secret_access_key: ENV.fetch("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
  region:,
  endpoint:,
  force_path_style: true
)

resource = Aws::S3::Resource.new(client:)

case command
when "upload"
  local_path = ARGV.fetch(1)
  key = [prefix, File.basename(local_path)].join("/")
  resource.bucket(bucket).object(key).upload_file(local_path)
  puts key
when "download-latest"
  target_path = ARGV.fetch(1)
  objects = client.list_objects_v2(bucket:, prefix:).contents.sort_by(&:last_modified)
  abort("No subset artifacts found in #{bucket}/#{prefix}") if objects.empty?

  key = objects.last.key
  resource.bucket(bucket).object(key).get(response_target: target_path)
  puts key
else
  abort("Usage: script/data_subsets/r2.rb upload <file> | download-latest <target_path>")
end

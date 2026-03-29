# frozen_string_literal: true

require "aws-sdk-s3"
require "open3"
require "tempfile"

class DatabaseBackupService
  attr_reader :database_url, :bucket_name, :endpoint, :region, :access_key_id, :secret_access_key, :prefix, :backup_name, :time

  def initialize(
    database_url: ENV["DATABASE_URL"],
    bucket_name: ENV["DATABASE_BACKUP_R2_BUCKET_NAME"].presence || ENV["CLOUDFLARE_R2_BUCKET_NAME"],
    endpoint: ENV["DATABASE_BACKUP_R2_ENDPOINT"].presence || ENV["CLOUDFLARE_R2_ENDPOINT"],
    region: ENV["DATABASE_BACKUP_R2_REGION"].presence || ENV["CLOUDFLARE_R2_REGION"],
    access_key_id: ENV["DATABASE_BACKUP_R2_ACCESS_KEY_ID"].presence || ENV["CLOUDFLARE_R2_ACCESS_KEY_ID"],
    secret_access_key: ENV["DATABASE_BACKUP_R2_SECRET_ACCESS_KEY"].presence || ENV["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
    prefix: ENV.fetch("DATABASE_BACKUP_R2_PREFIX", "miru/database-backups"),
    backup_name: ENV.fetch("DATABASE_BACKUP_NAME", "miru-production"),
    time: Time.current
  )
    @database_url = database_url
    @bucket_name = bucket_name
    @endpoint = endpoint
    @region = region
    @access_key_id = access_key_id
    @secret_access_key = secret_access_key
    @prefix = prefix
    @backup_name = backup_name
    @time = time
  end

  def process
    validate!

    Tempfile.create([filename_base, ".dump"]) do |file|
      file.binmode
      run_pg_dump!(file.path)
      upload_backup!(file.path)
    end
  end

  private

    def validate!
      raise ArgumentError, "DATABASE_URL is missing" if database_url.blank?
      raise ArgumentError, "R2 bucket is missing" if bucket_name.blank?
      raise ArgumentError, "R2 endpoint is missing" if endpoint.blank?
      raise ArgumentError, "R2 region is missing" if region.blank?
      raise ArgumentError, "R2 access key is missing" if access_key_id.blank?
      raise ArgumentError, "R2 secret key is missing" if secret_access_key.blank?
    end

    def run_pg_dump!(target_path)
      stdout, stderr, status = Open3.capture3(
        "pg_dump",
        "-Fc",
        "--no-owner",
        "--no-privileges",
        "--dbname",
        database_url,
        "--file",
        target_path
      )

      return if status.success?

      raise ["pg_dump failed", stdout, stderr].reject(&:blank?).join("\n")
    end

    def upload_backup!(path)
      client.put_object(bucket: bucket_name, key: archive_key, body: File.open(path, "rb"))
      client.put_object(bucket: bucket_name, key: latest_key, body: File.open(path, "rb"))
      archive_key
    end

    def filename_base
      "#{backup_name}-#{time.utc.strftime("%Y%m%d-%H%M%S")}"
    end

    def archive_key
      "#{prefix}/#{time.utc.strftime("%Y/%m/%d")}/#{filename_base}.dump"
    end

    def latest_key
      "#{prefix}/latest.dump"
    end

    def client
      @client ||= Aws::S3::Client.new(
        access_key_id: access_key_id,
        secret_access_key: secret_access_key,
        endpoint: endpoint,
        region: region,
        force_path_style: true
      )
    end
end

# frozen_string_literal: true

# Fix for AWS S3 "You can only specify one non-default checksum at a time" error
# This occurs when ActiveStorage tries to send multiple checksum algorithms to S3
# with aws-sdk-s3 >= 1.208.0
#
# The issue happens because:
# 1. ActiveStorage sends content_md5 for integrity checking
# 2. AWS SDK >= 1.208.0 automatically adds checksum_algorithm
# 3. S3 rejects requests with multiple checksums
#
# Solution: Prevent AWS SDK from adding automatic checksum_algorithm
# This is a known compatibility issue between aws-sdk-s3 >= 1.208.0 and ActiveStorage
# No official Rails fix is available as of January 2026

ActiveSupport.on_load(:active_storage_blob) do
  if defined?(ActiveStorage::Service::S3Service)
    ActiveStorage::Service::S3Service.class_eval do
      private

        def upload_with_single_part(key, io, checksum: nil, content_type: nil, content_disposition: nil,
  custom_metadata: {})
          # Get service-configured upload options
          configured_options = upload_options.dup

          # Remove checksum_algorithm to avoid conflict with content_md5
          configured_options.delete(:checksum_algorithm)

          # Merge with explicit parameters (explicit params take precedence)
          upload_params = configured_options.merge(
            body: io,
            content_type:,
            content_disposition:,
            content_md5: checksum,
            metadata: custom_metadata
          ).compact

          object_for(key).put(upload_params)
        end

        def upload_with_multipart(key, io, content_type: nil, content_disposition: nil, custom_metadata: {})
          part_size = [io.size.fdiv(MAXIMUM_UPLOAD_PARTS_COUNT).ceil, MINIMUM_UPLOAD_PART_SIZE].max

          # Get service-configured upload options
          configured_options = upload_options.dup

          # Remove checksum_algorithm to avoid conflict with multipart upload checksums
          configured_options.delete(:checksum_algorithm)

          # Merge with explicit parameters (explicit params take precedence)
          upload_params = configured_options.merge(
            content_type:,
            content_disposition:,
            part_size:,
            metadata: custom_metadata
          ).compact

          object_for(key).upload_stream(**upload_params) do |out|
            IO.copy_stream(io, out)
          end
        end

      public

        def url_for_direct_upload(key, expires_in:, content_type:, content_length:, checksum:, custom_metadata: {})
          instrument :url, key: do |payload|
            # Get service-configured upload options
            configured_options = upload_options.dup

            # Remove checksum_algorithm to avoid conflict with content_md5
            configured_options.delete(:checksum_algorithm)

            # Merge with explicit parameters (explicit params take precedence)
            presigned_url_params = configured_options.merge(
              expires_in: expires_in.to_i,
              content_type:,
              content_length:,
              content_md5: checksum,
              metadata: custom_metadata,
              whitelist_headers: ["content-length"]
            ).compact

            generated_url = object_for(key).presigned_url(:put, **presigned_url_params)

            payload[:url] = generated_url
            generated_url
          end
        end

        def compose(source_keys, destination_key, filename: nil, content_type: nil, disposition: nil,
  custom_metadata: {})
          content_disposition = content_disposition_with(type: disposition, filename:) if disposition && filename

          # Get service-configured upload options
          configured_options = upload_options.dup

          # Remove checksum_algorithm to avoid conflict
          configured_options.delete(:checksum_algorithm)

          # Merge with explicit parameters (explicit params take precedence)
          upload_params = configured_options.merge(
            content_type:,
            content_disposition:,
            part_size: MINIMUM_UPLOAD_PART_SIZE,
            metadata: custom_metadata
          ).compact

          object_for(destination_key).upload_stream(**upload_params) do |out|
            source_keys.each do |source_key|
              stream(source_key) do |chunk|
                IO.copy_stream(StringIO.new(chunk), out)
              end
            end
          end
        end
    end
  end
end

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
    end
  end
end

# frozen_string_literal: true

# Configure AWS SDK checksum behavior for compatibility with aws-sdk-s3 >= 1.208.0
# See: https://github.com/aws/aws-sdk-ruby/blob/version-3/gems/aws-sdk-s3/CHANGELOG.md#11080-2024-10-18
Aws.config.update(
  {
    s3: {
      # Set checksum calculation to WHEN_REQUIRED to maintain backward compatibility
      # and avoid breaking existing S3 operations
      request_checksum_calculation: "WHEN_REQUIRED",
      response_checksum_validation: "WHEN_REQUIRED"
    }
  }
)

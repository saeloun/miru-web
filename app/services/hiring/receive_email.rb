# frozen_string_literal: true

module Hiring
  class ReceiveEmail
    class InvalidInput < StandardError; end
    class Unavailable < StandardError; end
    MAX_BYTES = 20.megabytes

    def initialize(mailbox:, source:)
      @mailbox, @source = mailbox, source
    end

    def process
      unless @source.is_a?(String) && @source.bytesize.between?(1, MAX_BYTES)
        raise InvalidInput, "Provide an email of at most 20 MB."
      end
      storage = ActionMailbox.storage_service ? ActiveStorage::Blob.services.fetch(ActionMailbox.storage_service) : ActiveStorage::Blob.service
      raise Unavailable, "Private email storage is unavailable." if storage.public?

      content = EmailContent.new(@source)
      checksum = Digest::SHA256.hexdigest(@source)
      @mailbox.with_lock do
        raise ActiveRecord::RecordNotFound unless @mailbox.active?

        # Serialize identical raw messages across companies before sharing their transport blob.
        ApplicationRecord.connection.execute("SELECT pg_advisory_xact_lock(#{checksum.first(15).to_i(16)})")
        receipt = @mailbox.hiring_receipts.find_by(source_checksum: checksum)
        if receipt
          raise Unavailable, "Private email storage is unavailable." if receipt.raw_email.blob.service.public?

          schedule_existing(receipt.inbound_email) if receipt.state == "pending" && receipt.inbound_email
          next receipt
        end

        transport_id = "hiring-#{checksum}@inbound.miru"
        inbound = ActionMailbox::InboundEmail.find_by(message_id: transport_id)
        if inbound
          raise Unavailable, "Private email storage is unavailable." if inbound.raw_email.blob.service.public?

          schedule_existing(inbound)
        else
          blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new(@source), filename: "message.eml",
            content_type: "message/rfc822", service_name: ActionMailbox.storage_service)
          # Content-derived transport IDs keep original Message-IDs out of framework logs.
          inbound = ActionMailbox::InboundEmail.create!(message_id: transport_id,
            message_checksum: OpenSSL::Digest::SHA1.hexdigest(@source), raw_email: blob)
        end
        @mailbox.hiring_receipts.create!(company: @mailbox.company, inbound_email: inbound,
          source_checksum: checksum, message_key: content.key, received_at: Time.current, raw_email: inbound.raw_email.blob,
          details: { "source_email" => @mailbox.source_email, "source_name" => @mailbox.name })
      end
    rescue EmailContent::Malformed
      raise InvalidInput, "Provide a valid RFC 822 email."
    end

    private

      def schedule_existing(inbound)
        ActiveRecord.after_all_transactions_commit { inbound.route_later }
      end
  end
end

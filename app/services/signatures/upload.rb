# frozen_string_literal: true

module Signatures
  class Upload
    class Unavailable < StandardError; end

    attr_reader :documents

    def initialize(files)
      @files, @blobs = files, []
      unless files.is_a?(Array) && files.size.between?(1, 10) && files.all? { |file| file.is_a?(ActionDispatch::Http::UploadedFile) } &&
          files.sum(&:size) <= 25.megabytes
        raise PdfInfo::InvalidDocument, "Upload 1–10 PDFs, at most 5 MiB each and 25 MiB combined."
      end
      @documents = files.map do |file|
        metadata = PdfInfo.new(file.tempfile.path).process
        metadata.merge("key" => SecureRandom.uuid, "filename" => file.original_filename.to_s.tr("\x00-\x1f\x7f", "-").last(200), "byte_size" => file.size)
      end
      raise PdfInfo::InvalidDocument, "Use at most 100 source pages." if documents.sum { |document| document.fetch("pages").size } > PdfInfo::MAX_PAGES
    end

    def creation_facts
      documents.map { |document| document.slice("sha256", "filename", "byte_size") }
    end

    def persist!
      raise Unavailable, "Private document storage is unavailable." if ActiveStorage::Blob.service.public?

      @files.zip(documents).each do |file, document|
        blob = ActiveStorage::Blob.create_before_direct_upload!(filename: document.fetch("filename"), content_type: "application/pdf",
          byte_size: file.size, checksum: Digest::MD5.file(file.tempfile.path).base64digest,
          metadata: { identified: true, analyzed: true, signatures_sha256: document.fetch("sha256") })
        @blobs << blob
        file.tempfile.rewind
        blob.upload(file.tempfile, identify: false)
        document["blob_id"] = blob.id
      end
      [documents, @blobs]
    rescue IOError, SystemCallError
      raise Unavailable, "Private document storage is unavailable. Retry the upload.", cause: nil
    end

    def with_cleanup
      yield
    rescue StandardError
      @blobs.each do |blob|
        next if blob.attachments.exists?

        # A rolled-back blob is new again, so purge would leave its uploaded bytes behind.
        blob.persisted? ? blob.purge : blob.delete
      end
      raise
    end
  end
end

# frozen_string_literal: true

module Companies
  class InvoiceSignatureUploadService < ApplicationService
    MAX_FILE_SIZE = 500.kilobytes
    MAX_WIDTH = 300
    MAX_HEIGHT = 150
    PNG_SIGNATURE = "\x89PNG\r\n\x1A\n".b
    PNG_HEADER_BYTES = 24

    Result = Struct.new(:error, keyword_init: true) do
      def success?
        error.blank?
      end
    end

    def initialize(company:, file:)
      @company = company
      @file = file
    end

    def process
      validation_error = validate_file
      return Result.new(error: validation_error) if validation_error.present?

      company.invoice_signature.attach(file)
      Result.new
    end

    private

      attr_reader :company, :file

      def validate_file
        return "Signature file is required" if file.blank?
        return "Only PNG files are accepted" unless file.content_type == "image/png"
        return "File size must not exceed 500KB" if file.size > MAX_FILE_SIZE

        dimensions = png_dimensions
        return "File is not a valid PNG image" unless dimensions

        width, height = dimensions
        "Dimensions must not exceed 300x150 pixels" if width > MAX_WIDTH || height > MAX_HEIGHT
      end

      def png_dimensions
        file.tempfile.rewind
        header = file.tempfile.read(PNG_HEADER_BYTES)
        return nil unless header&.bytesize == PNG_HEADER_BYTES
        return nil unless header.byteslice(0, PNG_SIGNATURE.bytesize) == PNG_SIGNATURE

        header.byteslice(16, 8).unpack("NN")
      ensure
        file.tempfile.rewind
      end
  end
end

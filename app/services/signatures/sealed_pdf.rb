# frozen_string_literal: true

require "openssl"

class Signatures::SealedPdf < Signatures::PdfInfo
  class InvalidSeal < Signatures::PdfInfo::InvalidDocument; end

  MAX_BYTES = 10.megabytes
  MAX_PAGES = 125

  def process
    super.merge("seal_sha256" => @seal_sha256)
  rescue OpenSSL::OpenSSLError, ArgumentError, KeyError, TypeError
    invalid!
  end

  private

    def valid_form?(form) = %w[none AcroForm].include?(form)

    def check_structure(structure, count)
      super
      values = structure.fetch("qpdf").last.values.filter_map { |object| object["value"] if object["value"].is_a?(Hash) }
      invalid! if values.any? { |value| value.key?("/FT") && value["/FT"] != "/Sig" }
      signatures = values.select { |value| value["/Type"] == "/Sig" }
      # Documenso flattens recipient fields, then applies one service seal to each final PDF.
      invalid! unless signatures.size == 1
      verify_seal(signatures.first)
    end

    def verify_seal(signature)
      pin = ENV["DOCUMENSO_SEAL_SHA256"]
      invalid! unless pin.is_a?(String) && pin.match?(/\A[0-9a-f]{64}\z/)
      invalid! unless %w[/ETSI.CAdES.detached /adbe.pkcs7.detached].include?(signature["/SubFilter"])
      bytes = File.binread(@path)
      range = signature["/ByteRange"]
      invalid! unless range.is_a?(Array) && range.size == 4 && range.all? { |value| value.is_a?(Integer) && value >= 0 }
      start, length, tail, remaining = range
      invalid! unless start.zero? && length.positive? && length < tail && tail < bytes.size && tail + remaining == bytes.size
      gap = bytes.byteslice(length, tail - length)
      invalid! unless gap.bytesize <= 65_538 && gap.match?(/\A<[0-9a-fA-F]+>\z/) && (gap.bytesize - 2).even?
      contents = [gap[1...-1]].pack("H*")
      invalid! unless signature["/Contents"] == "b:#{contents.unpack1('H*')}"
      cms = OpenSSL::PKCS7.new(contents)
      invalid! unless cms.type == :signed && cms.detached? && cms.signers.size == 1
      signer = cms.signers.first
      certificates = cms.certificates.to_a.select { |cert| cert.serial == signer.serial && cert.issuer == signer.issuer }
      invalid! unless certificates.size == 1
      certificate = certificates.first
      @seal_sha256 = Digest::SHA256.hexdigest(certificate.to_der)
      invalid! unless ActiveSupport::SecurityUtils.secure_compare(pin, @seal_sha256) &&
        certificate.not_before <= Time.current && Time.current <= certificate.not_after
      # Pin the service identity explicitly; do not use the host's browser/NSS trust store.
      signed = bytes.byteslice(0, length) + bytes.byteslice(tail, remaining)
      invalid! unless cms.verify([], OpenSSL::X509::Store.new, signed, OpenSSL::PKCS7::NOVERIFY | OpenSSL::PKCS7::BINARY)
    end

    def invalid!
      raise InvalidSeal, "The completed PDF seal could not be verified. No signed download is available.", cause: nil
    end
end

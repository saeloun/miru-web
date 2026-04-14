# frozen_string_literal: true

module LocaleConfig
  DEFAULT_LOCALE = "en-US"
  SUPPORTED_LOCALES = [
    "en-GB",
    "en-US",
    "hi",
    "mr",
    "bn",
    "gu",
    "kn",
    "ml",
    "pa",
    "ta",
    "te",
    "ur",
    "es",
    "fr",
    "de",
    "it",
    "nl",
    "id",
    "pt-BR",
    "tr",
    "ar",
    "ja",
    "ko",
    "zh-CN"
  ].freeze

  module_function

  def normalize(locale)
    value = locale.to_s.strip
    return DEFAULT_LOCALE if value.blank?
    return DEFAULT_LOCALE if value.casecmp?("en")

    match = SUPPORTED_LOCALES.find { |supported| supported.casecmp?(value) }
    return match if match

    base = value.split("-").first
    return DEFAULT_LOCALE if base.casecmp?("en")
    base_match = SUPPORTED_LOCALES.find { |supported| supported.casecmp?(base) }

    base_match || DEFAULT_LOCALE
  end

  def supported?(locale)
    SUPPORTED_LOCALES.include?(normalize(locale))
  end

  def from_accept_language(header)
    header.to_s.split(",").each do |entry|
      candidate = entry.split(";").first.to_s.strip
      next if candidate.blank?

      return normalize(candidate) if SUPPORTED_LOCALES.any? { |locale| locale.casecmp?(candidate) }

      base = candidate.split("-").first
      return normalize(base) if SUPPORTED_LOCALES.any? { |locale| locale.casecmp?(base) }
    end

    DEFAULT_LOCALE
  end
end

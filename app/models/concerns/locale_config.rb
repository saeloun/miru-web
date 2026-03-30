# frozen_string_literal: true

module LocaleConfig
  DEFAULT_LOCALE = "en"
  SUPPORTED_LOCALES = [
    "en",
    "hi",
    "mr",
    "es",
    "fr",
    "de",
    "pt-BR",
    "ja",
    "zh-CN"
  ].freeze

  module_function

  def normalize(locale)
    value = locale.to_s.strip
    return DEFAULT_LOCALE if value.blank?

    match = SUPPORTED_LOCALES.find { |supported| supported.casecmp?(value) }
    match || DEFAULT_LOCALE
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

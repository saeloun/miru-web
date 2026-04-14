# frozen_string_literal: true

require Rails.root.join("app/models/concerns/locale_config")

I18n.available_locales = (LocaleConfig::SUPPORTED_LOCALES.map(&:to_sym) + [:en]).uniq
I18n.default_locale = LocaleConfig::DEFAULT_LOCALE.to_sym

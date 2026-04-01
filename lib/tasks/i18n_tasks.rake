namespace :i18n do
  INDIA_LOCALES = ENV.fetch("I18N_INDIA_LOCALES", "hi,mr,bn,gu,kn,ml,pa,ta,te,ur").split(",").freeze
  WORLD_LOCALES = ENV.fetch("I18N_WORLD_LOCALES", "en-GB,en-US,es,fr,de,it,nl,id,pt-BR,tr,ar,ja,ko,zh-CN").split(",").freeze

  def run_i18n_tasks!(*args)
    success = Bundler.with_unbundled_env do
      system("bundle", "exec", "i18n-tasks", *args)
    end

    abort("bundle exec i18n-tasks #{args.join(' ')} failed") unless success
  end

  def configured_backend
    ENV.fetch("I18N_TRANSLATION_BACKEND", "google")
  end

  def ai_backend
    ENV.fetch("I18N_AI_TRANSLATION_BACKEND", "openai")
  end

  def google_ready?
    ENV["GOOGLE_TRANSLATE_API_KEY"].to_s.strip != ""
  end

  def ai_ready?
    case ai_backend
    when "openai"
      ENV["OPENAI_API_KEY"].to_s.strip != ""
    else
      false
    end
  end

  def translate_batch!(locales, backend:)
    run_i18n_tasks!("translate-missing", "--from=base", "--backend=#{backend}", *locales)
    run_i18n_tasks!("normalize", "-p")
  end

  desc "Print the effective i18n-tasks configuration"
  task :config do
    run_i18n_tasks!("config")
  end

  desc "Check locale health, missing keys, and normalization"
  task :health do
    run_i18n_tasks!("health")
  end

  desc "Normalize locale files using i18n-tasks routing"
  task :normalize do
    run_i18n_tasks!("normalize", "-p")
  end

  desc "Print missing translations"
  task :missing do
    run_i18n_tasks!("missing")
  end

  desc "Translate major Indian locales with the configured backend"
  task :translate_india do
    translate_batch!(INDIA_LOCALES, backend: configured_backend)
  end

  desc "Translate major world locales with the configured backend"
  task :translate_world do
    translate_batch!(WORLD_LOCALES, backend: configured_backend)
  end

  desc "Translate all supported locales with the configured backend"
  task :translate_all do
    translate_batch!((INDIA_LOCALES + WORLD_LOCALES).uniq, backend: configured_backend)
  end

  desc "Run Google translation first, then optional AI fallback, then health checks"
  task :translate_auto do
    locales = (INDIA_LOCALES + WORLD_LOCALES).uniq

    if google_ready?
      translate_batch!(locales, backend: "google")
    elsif configured_backend == "google"
      abort("GOOGLE_TRANSLATE_API_KEY is required for google auto-translation")
    end

    if ENV["I18N_AI_TRANSLATION_FALLBACK"] == "true"
      if ai_ready?
        translate_batch!(locales, backend: ai_backend)
      else
        abort("#{ai_backend.upcase}_API_KEY is required for AI fallback") if ai_backend == "openai"
      end
    elsif configured_backend != "google"
      translate_batch!(locales, backend: configured_backend)
    end

    run_i18n_tasks!("health")
  end
end

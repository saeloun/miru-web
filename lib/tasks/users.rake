# frozen_string_literal: true

namespace :users do
  desc "Normalize and backfill locale for existing users"
  task backfill_locale: :environment do
    counts = {
      scanned: 0,
      updated: 0,
      already_valid: 0
    }

    User.find_each do |user|
      counts[:scanned] += 1
      normalized_locale = LocaleConfig.normalize(user[:locale])

      if user[:locale] == normalized_locale
        counts[:already_valid] += 1
        next
      end

      user.update_columns(locale: normalized_locale, updated_at: Time.current)
      counts[:updated] += 1
      puts "updated user=#{user.id} locale=#{user[:locale].inspect} -> #{normalized_locale}"
    end

    puts "scanned=#{counts[:scanned]} updated=#{counts[:updated]} already_valid=#{counts[:already_valid]}"
  end
end

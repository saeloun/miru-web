namespace :users do
  desc "Backfill missing or invalid user locales to the default locale"
  task backfill_locales: :environment do
    updated = 0

    User.find_each do |user|
      normalized_locale = LocaleConfig.normalize(user.locale)
      next if user.locale == normalized_locale

      user.update_columns(locale: normalized_locale)
      updated += 1
    end

    puts "Backfilled #{updated} users"
  end
end

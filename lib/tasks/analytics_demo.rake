# frozen_string_literal: true

namespace :analytics do
  desc "Seed reproducible demo data for analytics"
  task seed_demo: :environment do
    if Rails.env.production? && ENV["FORCE"] != "1"
      abort "Refusing to seed demo analytics data in production. Re-run with FORCE=1 if intentional."
    end

    Analytics::DemoSeeder.process
  end
end

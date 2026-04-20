# frozen_string_literal: true

namespace :analytics do
  desc "Seed reproducible demo data for analytics"
  task seed_demo: :environment do
    Analytics::DemoSeeder.process
  end
end

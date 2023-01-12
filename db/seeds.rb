# frozen_string_literal: true

Dir[File.join(Rails.root, "db", "seeds", "production", "*.rb")].sort.each do |seed|
  load seed
end

if !Rails.env.production?
  Dir[File.join(Rails.root, "db", "seeds", "*.rb")].sort.each do |seed|
    load seed
  end
end

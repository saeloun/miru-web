# frozen_string_literal: true

return if Rails.env.production?

Dir[File.join(Rails.root, "db", "seeds", "*.rb")].sort.each do |seed|
  load seed
end

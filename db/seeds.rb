# frozen_string_literal: true

Dir[File.join(Rails.root, "db", "seeds", "*.rb")].sort.each do |seed|
  load seed unless seed == File.join(Rails.root, "db", "seeds", "constant.rb")
end

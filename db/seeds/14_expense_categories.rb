  # frozen_string_literal: true

  # Category Start

  @outing_category_india = @saeloun_india.expense_categories.create!({ name: "Outing" })
  @conference_category_india = @saeloun_india.expense_categories.create!({ name: "Conference" })

  puts "Expense Categories created"

# Category End

# frozen_string_literal: true

@p1 = @client2.projects.create!({ name: "Wow Web", description: "Website App", billable: true })
@p2 = @client2.projects.create!({ name: "Wow Android", description: "Android App", billable: false })

# Reindex Searchkick indexes
Project.reindex

puts "Projects Created"
# Projects End

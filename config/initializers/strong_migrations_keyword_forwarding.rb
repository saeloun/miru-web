# frozen_string_literal: true

migration_parameters = StrongMigrations::DatabaseTasks.instance_method(:migrate).parameters.map(&:first)
if migration_parameters.include?(:rest) && (migration_parameters & [:key, :keyreq, :keyrest]).empty?
  StrongMigrations::DatabaseTasks.send(:ruby2_keywords, :migrate)
end

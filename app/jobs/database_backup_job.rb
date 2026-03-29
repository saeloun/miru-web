# frozen_string_literal: true

class DatabaseBackupJob < ApplicationJob
  queue_as :default

  def perform
    return unless ActiveModel::Type::Boolean.new.cast(ENV.fetch("DATABASE_BACKUP_ENABLED", Rails.env.production?))

    DatabaseBackupService.new.process
  end
end

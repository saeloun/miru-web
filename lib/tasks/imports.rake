# frozen_string_literal: true

namespace :imports do
  task :harvest_time_entries, [:company_id, :actor_email, :csv_path, :dry_run] => :environment do |_task, args|
    company = Company.find(args[:company_id])
    actor = company.users.merge(Employment.kept).find_by!("LOWER(users.email) = ?", args[:actor_email].to_s.downcase)
    data_import = company.data_imports.create!(
      user: actor,
      source: "harvest",
      dry_run: ActiveModel::Type::Boolean.new.cast(args[:dry_run])
    )
    File.open(args[:csv_path]) do |file|
      data_import.file.attach(io: file, filename: File.basename(args[:csv_path]), content_type: "text/csv")
    end
    Imports::HarvestTimeEntriesImporter.new(data_import).process
    puts JSON.pretty_generate(data_import.summary)
  end
end

# frozen_string_literal: true

# This migration comes from solid_queue (originally 20240813160053)
class MakeNameNotNull < ActiveRecord::Migration[7.1]
  def up
    SolidQueue::Process.where(name: nil).find_each do |process|
      process.name ||= [ process.kind.downcase, SecureRandom.hex(10) ].join("-")
      process.save!
    end

    safety_assured { change_column :solid_queue_processes, :name, :string, null: false }
    safety_assured { add_index :solid_queue_processes, [ :name, :supervisor_id ], unique: true }
  end

  def down
    safety_assured { remove_index :solid_queue_processes, [ :name, :supervisor_id ] }
    safety_assured { change_column :solid_queue_processes, :name, :string, null: true }
  end
end

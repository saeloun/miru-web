# frozen_string_literal: true

class Invoices::ActionTrailsService < ApplicationService
  attr_reader :versions, :users, :action_trails

  def initialize(invoice_id)
    @versions = Invoice.find(invoice_id).versions.reorder(created_at: :desc)
    @users = {}
    @action_trails = []
  end

  def process
    fetch_users
    generate_trails_from_versions
  end

  private

    def generate_trails_from_versions
      versions.each do |version|
        send("handle_#{version.event}_event", version)
      end
    end

    def fetch_users
      user_ids = versions.pluck(:whodunnit)
      @users = User.where(id: user_ids)
        .includes(:avatar_attachment)
        .index_by(&:id)
    end

    def handle_create_event(version)
      @action_trails << generic_trail_data(version)
    end

    def handle_update_event(version)
      @action_trails << generic_trail_data(version)
    end

    def generic_trail_data(version)
      user_id = Integer(version.whodunnit)
      {
        type: version.event,
        user_name: users[user_id].full_name,
        user_avatar: users[user_id].avatar,
        created_at: version.created_at
      }
    end
end

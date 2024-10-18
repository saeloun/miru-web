# frozen_string_literal: true

class CreateMailingSubscriptions < ActiveRecord::Migration[7.1]
  def up
    User.find_each do |user|
      user.companies.each do |company|
        if user.has_role?(:client, company)
          user.subscribe("Client Invoices")
          user.subscribe("Client Payment Reminders")
          user.subscribe("Payment Notifications")
        elsif user.has_role?(:admin, company) || user.has_role?(:owner, company)
          user.subscribe("Payment Notifications")
        elsif user.has_role?(:employee, company) || user.has_role?(:admin, company)
          user.subscribe("Weekly Reminders")
        end
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

# frozen_string_literal: true

require_relative("./verifiers/invitation_verifier.rb")

class CreateInvitations < ActiveRecord::Migration[7.0]
  def up
    User.where(invitation_accepted_at: nil).where.not(invitation_token: nil).find_each do |user|
      user.roles.find_each do |role|
        expiration_date = if user.invitation_sent_at.is_a? ActiveSupport::TimeWithZone
          user.invitation_sent_at + 14.days
        else
          Time.current + 14.days
        end

        Invitation.create!(
          company: role.resource,
          sender: user.invited_by,
          recipient_email: user.email,
          role: role.name.to_sym,
          token: user.invitation_token,
          expired_at: expiration_date,
          first_name: user.first_name,
          last_name: user.last_name
        )
      end

      InvitationVerifier.verify!
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

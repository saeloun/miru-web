# frozen_string_literal: true

require_relative("./verifiers/invitation_verifier.rb")

class CreateInvitations < ActiveRecord::Migration[7.0]
  def up
    Invitation.skip_callback(:validation, :before, :set_expired_at)
    Invitation.skip_callback(:validation, :before, :set_token)
    Invitation.skip_callback(:commit, :after, :send_invitation_mail)

    User.where.not(invitation_created_at: nil).find_each do |user|
      user.roles.find_each do |role|
        expiration_date = if user.invitation_sent_at.is_a? ActiveSupport::TimeWithZone
          user.invitation_sent_at + 14.days
        else
          Time.current + 14.days
        end

        invitation = Invitation.new(
          company: role.resource,
          sender_id: user.invited_by_id,
          recipient_email: user.email,
          role: role.name.to_sym,
          token: user.invitation_token,
          expired_at: expiration_date,
          first_name: user.first_name,
          last_name: user.last_name,
          accepted_at: user.invitation_accepted_at
        )

        invitation.set_token if invitation.token.nil?
        invitation.save!(validate: false)
      end
    end

    InvitationVerifier.verify!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

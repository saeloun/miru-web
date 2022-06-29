desc 'Move all the pending devise invitable invitation to invitation table'
task move_devise_invitation_to_invitation_table: :environment do
  User.where(invitation_accepted_at: nil).where.not(invitation_token: nil).find_each do |user|
    user.roles.each do |role|
      expiration_date = if user.invitation_sent_at.is_a? ActiveSupport::TimeWithZone
        user.invitation_sent_at + 14.days
      else
        Time.now + 14.days
      end

      Invitation.create!(
        company: role.resource,
        sender_id: user.invited_by.id,
        recipient_email: user.email,
        role: role.name.to_sym,
        token: user.invitation_token,
        expired_at: expiration_date,
        first_name: user.first_name,
        last_name: user.last_name
      )
    end
  end
end

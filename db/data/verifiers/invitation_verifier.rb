# frozen_string_literal: true

class InvitationVerifier
  def self.verify!
    Invitation.find_each do |invitation|
      unless invitation.recipient_email?
        raise "recipient_email is not populated for Invitation with ID #{invitation.id}"
      end

      unless invitation.role?
        raise "role is not populated for Invitation with ID #{invitation.id}"
      end

      unless invitation.token?
        raise "token is not populated for Invitation with ID #{invitation.id}"
      end
    end

    puts "Invitation data migration verified successfully!"
  end
end

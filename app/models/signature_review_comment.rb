# frozen_string_literal: true

class SignatureReviewComment < ApplicationRecord
  belongs_to :revision, class_name: "SignatureRequestRevision"
  belongs_to :author_user, class_name: "User", optional: true
  belongs_to :author_invitation, class_name: "SignatureReviewInvitation", optional: true
  encrypts :body
  self.filter_attributes += [:body]

  validates :body, presence: true, length: { maximum: 4000 }
  validate :valid_author

  def readonly?
    persisted?
  end

  def author_name
    author_user ? author_user.full_name : author_invitation.recipient.fetch("name")
  end

  private

    def valid_author
      if author_user.present? == author_invitation.present? ||
          (author_invitation && author_invitation.revision_id != revision_id)
        errors.add(:base, "Comment author must belong to this review")
      end
    end
end

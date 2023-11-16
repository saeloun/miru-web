# frozen_string_literal: true

# == Schema Information
#
# Table name: ses_invalid_emails
#
#  id         :bigint           not null, primary key
#  bounce     :boolean          default(FALSE)
#  compliant  :boolean          default(FALSE)
#  email      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class SesInvalidEmail < ApplicationRecord
end

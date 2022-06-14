# frozen_string_literal: true

module UserRoles
  extend ActiveSupport::Concern

  ROLES = %i[owner admin employee book_keeper]
  ROLES.each do |role|
    define_method "has_#{role}_role?" do |company|
      return false if company.nil?

      self.has_cached_role?("#{role}".to_sym, company)
    end
  end
end

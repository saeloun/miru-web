# frozen_string_literal: true

module PhoneNumberValidatable
  extend ActiveSupport::Concern

  MIN_PHONE_DIGITS = 2
  MAX_PHONE_DIGITS = 15

  private

    def validate_phone_number(attribute)
      phone_number = public_send(attribute)
      return if phone_number.blank?

      digits_count = phone_number.to_s.gsub(/\D/, "").length

      if digits_count < MIN_PHONE_DIGITS
        errors.add(attribute, "must contain at least #{MIN_PHONE_DIGITS} digits")
      elsif digits_count > MAX_PHONE_DIGITS
        errors.add(attribute, "cannot exceed #{MAX_PHONE_DIGITS} digits")
      elsif !Phonelib.parse(phone_number).valid?
        errors.add(attribute, :invalid)
      end
    end
end

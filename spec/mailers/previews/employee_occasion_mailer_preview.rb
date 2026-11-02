# frozen_string_literal: true

class EmployeeOccasionMailerPreview < ActionMailer::Preview
  def birthday
    message("birthday")
  end

  def work_anniversary
    message("work_anniversary")
  end

  private

    def message(kind)
      company = Company.new(id: 123, name: "Synthetic Preview Studio")
      employee = User.new(id: 456, first_name: "Alex", last_name: "Example", date_of_birth: Date.new(1990, 2, 28))
      admin = User.new(email: "admin@example.test")
      employment = Employment.new(company:, user: employee, joined_at: Date.new(2020, 2, 28))
      EmployeeOccasionMailer.reminder(employment:, admin:, kind:, event_on: Date.new(2027, 2, 28))
    end
end

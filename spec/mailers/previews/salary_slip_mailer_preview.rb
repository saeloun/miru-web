# frozen_string_literal: true

class SalarySlipMailerPreview < ActionMailer::Preview
  def published
    company = Company.new(id: 123, name: "Synthetic Preview Studio")
    slip = Struct.new(:company, :pay_month).new(company, Date.new(2026, 9, 1))
    SalarySlipMailer.with(slip:, recipient: "employee@example.test").published
  end
end

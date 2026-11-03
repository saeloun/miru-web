# frozen_string_literal: true

module Payroll
  module ConsultantAllocation
    Result = Data.define(:beneficiary, :amount_minor)

    module_function

    def call(line:, arrangement:)
      net = line.dig("amounts", "net_minor")
      reimbursements = line.dig("amounts", "reimbursements_minor")
      return [Result.new(beneficiary: "consultant", amount_minor: net)] unless arrangement

      split_base = net - reimbursements
      allocated = allocated_minor(arrangement, split_base)
      remainder = split_base - allocated
      shares = { arrangement.allocated_to => allocated, arrangement.remainder_to => remainder }
      shares["consultant"] += reimbursements
      results = %w[consultant spouse].map { |party| Result.new(beneficiary: party, amount_minor: shares.fetch(party)) }
      raise MercuryPayment::Blocked.new("allocation_leaves_empty_transfer") unless results.all? { |result| result.amount_minor.positive? }

      results
    end

    def allocated_minor(arrangement, split_base)
      raise MercuryPayment::Blocked.new("allocation_leaves_empty_transfer") unless split_base.positive?

      value = arrangement.allocation_value
      allocated = if arrangement.allocation_kind == "percentage"
        (BigDecimal(split_base) * value / 100).round(0, BigDecimal::ROUND_HALF_UP).to_i
      else
        (value * 100).to_i
      end
      raise MercuryPayment::Blocked.new("allocation_exceeds_split_base") if allocated > split_base

      allocated
    end
  end
end

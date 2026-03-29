# frozen_string_literal: true

module TimeoffEntries
  class CustomLeaveBalanceService < ApplicationService
    def initialize(leave:, user_id:, working_hours_per_day:, working_days_per_week:)
      @leave = leave
      @user_id = user_id
      @working_hours_per_day = working_hours_per_day
      @working_days_per_week = working_days_per_week
    end

    def process
      return [] unless leave

      user_custom_leaves.map do |custom_leave|
        total_days = calculate_custom_leave_allocation(custom_leave)
        timeoff_entries_duration = custom_leave.timeoff_entries.kept.where(user_id:).sum(:duration)
        total_minutes = total_days * working_hours_per_day * 60
        net_duration = total_minutes - timeoff_entries_duration
        net_hours = net_duration / 60
        net_days = net_hours.abs / working_hours_per_day
        extra_hours = net_hours.abs % working_hours_per_day

        {
          id: custom_leave.id,
          name: custom_leave.name,
          icon: "custom",
          color: "custom",
          total_leave_type_days: total_days,
          timeoff_entries_duration:,
          net_duration:,
          net_days:,
          type: "custom_leave",
          label: balance_label(net_hours, net_days, extra_hours)
        }
      end
    end

    private

      attr_reader :leave, :user_id, :working_hours_per_day, :working_days_per_week

      def user_custom_leaves
        leave.custom_leaves.joins(:custom_leave_users)
          .where(custom_leave_users: { user_id: })
      end

      def calculate_custom_leave_allocation(custom_leave)
        case custom_leave.allocation_period
        when "days"
          custom_leave.allocation_value
        when "weeks"
          custom_leave.allocation_value * working_days_per_week
        when "months"
          custom_leave.allocation_value * working_days_per_week * 4
        else
          custom_leave.allocation_value
        end
      end

      def balance_label(net_hours, net_days, extra_hours)
        if net_hours.abs < working_hours_per_day
          "#{net_hours} hours"
        else
          "#{net_days} days #{extra_hours} hours"
        end
      end
  end
end

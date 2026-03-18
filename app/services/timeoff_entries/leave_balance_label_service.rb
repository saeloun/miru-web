# frozen_string_literal: true

module TimeoffEntries
  class LeaveBalanceLabelService < ApplicationService
    attr_reader :net_hours, :working_hours_per_day

    def initialize(net_hours, working_hours_per_day)
      @net_hours = net_hours
      @working_hours_per_day = working_hours_per_day
    end

    def process
      return "0 hours" if net_hours.zero?

      if net_hours.negative?
        overdrawn_label
      elsif net_hours < working_hours_per_day
        "#{net_hours} #{'hour'.pluralize(net_hours)}"
      elsif extra_hours.zero?
        "#{net_days} #{'day'.pluralize(net_days)}"
      else
        "#{net_days} #{'day'.pluralize(net_days)} #{extra_hours} #{'hour'.pluralize(extra_hours)}"
      end
    end

    private

      def overdrawn_label
        if total_overdrawn_hours < working_hours_per_day
          "Overdrawn by #{total_overdrawn_hours} #{'hour'.pluralize(total_overdrawn_hours)}"
        elsif overdrawn_extra_hours.zero?
          "Overdrawn by #{overdrawn_days} #{'day'.pluralize(overdrawn_days)}"
        else
          "Overdrawn by #{overdrawn_days} #{'day'.pluralize(overdrawn_days)} #{overdrawn_extra_hours} #{'hour'.pluralize(overdrawn_extra_hours)}"
        end
      end

      def total_overdrawn_hours
        @total_overdrawn_hours ||= net_hours.abs
      end

      def net_days
        @net_days ||= net_hours / working_hours_per_day
      end

      def extra_hours
        @extra_hours ||= net_hours % working_hours_per_day
      end

      def overdrawn_days
        @overdrawn_days ||= total_overdrawn_hours / working_hours_per_day
      end

      def overdrawn_extra_hours
        @overdrawn_extra_hours ||= total_overdrawn_hours % working_hours_per_day
      end
  end
end

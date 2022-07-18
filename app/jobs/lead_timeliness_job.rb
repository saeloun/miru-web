# frozen_string_literal: true

class LeadTimelinessJob < ApplicationJob
  queue_as :default

  TIMELINE_META_ACTION_OPTIONS = LeadTimeline::META_ACTION_OPTIONS.map { |i| [i.key, i.id] }.to_h

  def perform(lead_id, action, previous_changes)
    @lead = Lead.find(lead_id)
    action = action.to_sym
    timeline_attributes = {
      kind: 0,
      action_created_by_id: @lead.created_by_id,
      meta_action: TIMELINE_META_ACTION_OPTIONS[action] || -1,
      meta_previous_changes: previous_changes,
      created_at: previous_changes["updated_at"]&.last
    }

    case action
    when :create
      index_system_display_title = "<b>#{@lead.created_by_name}</b> added the lead <b>#{@lead.name}</b>"
      @lead.lead_timelines.create!(
        **timeline_attributes,
        action_reporter_id: @lead.created_by_id,
        index_system_display_title:,
      )
    when :update
      display_field_name_arr = []
      display_field_value_arr = []

      previous_changes.each do |field_name, old_new_val_arr|
        next if ["updated_at", "updated_by_id"].include?(field_name)

        display_field_name = field_name
        old_val = old_new_val_arr[0] || "Unassigned"
        new_val = old_new_val_arr[1]

        case field_name
        when "budget_status_code"
          display_field_name = "budget_status"
          old_val = @lead.budget_status_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.budget_status_code_name_hash[new_val.to_i]
        when "industry_code"
          display_field_name = "industry"
          old_val = @lead.industry_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.industry_code_name_hash[new_val.to_i]
        when "quality_code"
          display_field_name = "quality"
          old_val = @lead.quality_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.quality_code_name_hash[new_val.to_i]
        when "state_code"
          display_field_name = "state"
          old_val = @lead.state_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.state_code_name_hash[new_val.to_i]
        when "status_code"
          display_field_name = "status"
          old_val = @lead.status_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.status_code_name_hash[new_val.to_i]
        when "preferred_contact_method_code"
          display_field_name = "preferred_contact_method"
          old_val = @lead.preferred_contact_method_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.preferred_contact_method_code_name_hash[new_val.to_i]
        when "initial_communication"
          old_val = @lead.initial_communication_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.initial_communication_name_hash[new_val.to_i]
        when "source_code"
          display_field_name = "source"
          old_val = @lead.source_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.source_code_name_hash[new_val.to_i]
        when "priority_code"
          display_field_name = "priority"
          old_val = @lead.priority_code_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.priority_code_name_hash[new_val.to_i]
        when "need"
          old_val = @lead.need_name_hash[old_val.to_i] if old_val != "Unassigned"
          new_val = @lead.need_name_hash[new_val.to_i]
        when "tech_stack_ids"
          display_field_name = "tech_stacks"
          if old_val.kind_of?(Array)
            old_val = (@lead.tech_stack_name_hash.select { |k, v|
    old_val.map(&:to_i).include?(k)
  } || {}).values.flatten.compact.uniq
          else
            old_val = @lead.tech_stack_name_hash[old_val] if old_val != "Unassigned"
          end
          if new_val.kind_of?(Array)
            new_val = (@lead.tech_stack_name_hash.select { |k, v|
    new_val.map(&:to_i).include?(k)
  } || {}).values.flatten.compact.uniq
          else
            new_val = @lead.tech_stack_name_hash[new_val]
          end
        when "assignee_id"
          display_field_name = "assignee"
          old_val = User.find(old_val)&.full_name if old_val != "Unassigned"
          new_val = @lead.assignee_name
        when "reporter_id"
          display_field_name = "reporter"
          old_val = User.find(old_val)&.full_name if old_val != "Unassigned"
          new_val = @lead.reporter_name
        end

        display_field_name_arr << display_field_name.tr("_", " ").capitalize

        display_field_value_arr << "#{old_val.kind_of?(Array) ? old_val.join(",") : old_val}&nbsp; -> &nbsp;#{new_val.kind_of?(Array) ? new_val.join(",") : new_val}"
      end

      index_system_display_title = "<b>#{@lead.updated_by_name}</b> updated the <b>#{display_field_name_arr.join(', ')}</b>"
      index_system_display_message = "<p style='font-size: 0.875rem;line-height: 1.25rem;'>#{display_field_value_arr.join('<br />')}</p>"

      @lead.lead_timelines.create!(
        **timeline_attributes,
        action_created_by_id: @lead.updated_by_id,
        index_system_display_title:,
        index_system_display_message:
      )
    when :destroy
      index_system_display_title = "<b>#{@lead.updated_by_name}</b> destroyed the lead <b>#{display_field_name_arr.join(', ')}</b>"
      index_system_display_message = nil

      @lead.lead_timelines.create!(
        **timeline_attributes,
        action_created_by_id: @lead.updated_by_id,
        index_system_display_title:,
        index_system_display_message:
      )
    else
      @lead.lead_timelines.create!(
        index_system_display_title: "Oops! Looks like something not right.",
        index_system_display_message: "Please report to us."
      )
    end
  end
end

# frozen_string_literal: true

class ApplicationEvent
  attr_reader :record, :actor

  def initialize(record, actor: Current.user)
    @record = record
    @actor = actor
  end

  def to_h
    { actor: actor && { id: actor.id, type: actor.class.name }, data: event_data }
  end
end

# frozen_string_literal: true

module ApplicationHelper
  def user_avatar(user)
    if user.avatar.attached?
      user.avatar
    else
      image_url "avatar.svg"
    end
  end

  def error_message_on(resource, attribute)
    return unless resource.respond_to?(:errors) && resource.errors.include?(attribute)
    field_error(resource, attribute)
  end

  def error_message_class(resource, attribute)
    if resource.respond_to?(:errors) && resource.errors.include?(attribute)
      "border-red-600 focus:ring-red-600 focus:border-red-600"
    else
      "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
    end
  end

  def link_to_add_row(name, f, association, **args)
    new_object = f.object.send(association).klass.new
    id = new_object.object_id
    fields = f.fields_for(association, new_object, child_index: id) do |builder|
      render(association.to_s.singularize, f: builder)
    end
    link_to(name, "#", class: "add_fields " + args[:class], data: { id: id, fields: fields.delete("\n") })
  end

  private
    def field_error(resource, attribute)
      resource.errors[attribute].first
    end
end

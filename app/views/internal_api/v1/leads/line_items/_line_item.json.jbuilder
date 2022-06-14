# frozen_string_literal: true

json.extract! line_item, :id, :name, :kind, :kind_name, :description, :price,
                          :number_of_resource, :resource_expertise_level

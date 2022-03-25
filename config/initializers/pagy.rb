# frozen_string_literal: true

require "pagy/extras/metadata"
Pagy::DEFAULT[:metadata] = %i[scaffold_url page count in items pages prev next last]

require "pagy/extras/items"

Pagy::DEFAULT.freeze

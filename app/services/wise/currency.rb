# frozen_string_literal: true

module Wise
  class Currency < Api
    def list
      connection.get("/v2/borderless-accounts-configuration/profiles/#{profile_id}/available-currencies")
    end
  end
end

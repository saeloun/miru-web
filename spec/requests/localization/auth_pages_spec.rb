# frozen_string_literal: true

require "rails_helper"

RSpec.describe "localized auth pages", type: :request do
  it "renders the login shell for supported browser locales" do
    [
      "hi-IN,hi;q=0.9,en;q=0.8",
      "mr-IN,mr;q=0.9,en;q=0.8",
      "bn-IN,bn;q=0.9,en;q=0.8",
      "ta-IN,ta;q=0.9,en;q=0.8",
      "te-IN,te;q=0.9,en;q=0.8",
      "ur-PK,ur;q=0.9,en;q=0.8",
      "tr-TR,tr;q=0.9,en;q=0.8",
      "es-ES,es;q=0.9,en;q=0.8",
      "fr-FR,fr;q=0.9,en;q=0.8",
      "de-DE,de;q=0.9,en;q=0.8",
      "pt-BR,pt;q=0.9,en;q=0.8",
      "ja-JP,ja;q=0.9,en;q=0.8",
      "zh-CN,zh;q=0.9,en;q=0.8",
      "en-GB,en;q=0.9",
      "en-US,en;q=0.9",
    ].each do |accept_language|
      get "/login", headers: { "Accept-Language" => accept_language }

      expect(response).to have_http_status(:ok)
    end
  end
end

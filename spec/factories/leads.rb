# frozen_string_literal: true

FactoryBot.define do
  factory :lead do
    name { "MyString" }
    primary_email { "MyString" }
    other_email { "MyString" }
    address { "MyText" }
    mobilephone { "MyString" }
    telephone { "MyString" }
    skypeid { "MyString" }
    linkedinid { "MyString" }
    timezone { "MyString" }
    country_code { "MyString" }
    description { "MyString" }
    donotbulkemail { false }
    donotemail { false }
    donotfax { false }
    donotphone { false }
    industry { "MyString" }
    quality_code { 1 }
    priority_code { 1 }
    state_code { 1 }
    industry_code { 1 }
  end
end

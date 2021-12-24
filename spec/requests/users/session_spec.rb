# frozen_string_literal: true

RSpec.describe "Users::SessionController", type: :request do
  let(:user) { build(:user) }

  describe "POST /users/sign_in" do
    it "signs up a user" do
      post "/users/sign_in", params: { user: { email: user.email, password: user.password } }

      present_user = User.find_by(email: user.email)

      if present_user
        expect(response).to have_http_status(201)
      else
        expect(response).to have_http_status(422)
      end
    end
  end
end

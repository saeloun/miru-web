import { signupPath } from "../constants/routes/paths";

describe("Sign_up", () => {
    before(function () {
        cy.visit(signupPath);
    })

    it('should give error on clicking signup with blank values', function () {
    })
    it('should signup with email', function () {
    })
    it('should signup with google', function () {
    })
    it('should signup with apple', function () {
    })
})
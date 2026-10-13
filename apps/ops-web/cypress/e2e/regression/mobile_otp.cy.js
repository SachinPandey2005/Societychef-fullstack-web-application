describe('Regression - Mobile OTP Authentication', () => {
  it('should allow a user to login via OTP', () => {
    // TODO: replace with actual mobile URL if applicable
    cy.visit('http://localhost:5173/otp-login');
    // Placeholder steps
    cy.get('input[name="phone"]').type('1234567890');
    cy.get('button').contains('Send OTP').click();
    cy.wait(1000); // simulate OTP receipt
    cy.get('input[name="otp"]').type('000000');
    cy.get('button').contains('Verify').click();
    // Verify successful navigation after login
    cy.url().should('include', '/dashboard');
  });
});

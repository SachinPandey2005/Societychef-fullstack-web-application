describe('Regression - Admin Login', () => {
  it('should allow admin to login and access dashboard', () => {
    cy.visit('http://localhost:5173/admin/login');
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button').contains('Login').click();
    cy.url().should('include', '/admin/dashboard');
    // Verify dashboard element exists
    cy.get('[data-test-id="admin-dashboard"]').should('be.visible');
  });
});

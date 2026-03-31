document.addEventListener('DOMContentLoaded', () => {
  const adminLoginForm = document.querySelector('#admin-login-form');

  function showMessage(element, message, type = 'error') {
    if (!element) return;
    element.textContent = message;
    element.className = type === 'success' ? 'alert-success' : 'alert-error';
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  if (!adminLoginForm) return;

  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = adminLoginForm.querySelector('[name="email"]').value.trim();
    const password = adminLoginForm.querySelector('[name="password"]').value.trim();
    const alertBox = document.querySelector('#admin-login-alert');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      const result = await response.json();
      if (result.role !== 'admin') {
        showMessage(alertBox, 'Admin access is required for this page.');
        return;
      }
      localStorage.setItem('nde_token', result.token);
      localStorage.setItem('nde_role', result.role);
      localStorage.setItem('nde_name', result.name);
      window.location.href = '/pages/admin/dashboard.html';
    } catch (error) {
      showMessage(alertBox, error.message || 'Unable to sign in.');
    }
  });
});

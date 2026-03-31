document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.querySelector('#sign-in-form');
  const signUpForm = document.querySelector('#sign-up-form');

  async function showAlert(container, message, type = 'error') {
    if (!container) return;
    container.textContent = message;
    container.className = type === 'success' ? 'alert-success' : 'alert-error';
    container.style.display = 'block';
    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }

  async function handleLogin(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    return response.json();
  }

  if (signInForm) {
    signInForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = signInForm.querySelector('[name="email"]').value.trim();
      const password = signInForm.querySelector('[name="password"]').value.trim();
      const alertBox = document.querySelector('#sign-in-alert');
      try {
        const result = await handleLogin(email, password);
        localStorage.setItem('nde_token', result.token);
        localStorage.setItem('nde_role', result.role);
        localStorage.setItem('nde_name', result.name);
        if (result.role === 'admin') {
          window.location.href = '/pages/admin/dashboard.html';
        } else {
          window.location.href = '/pages/student/dashboard.html';
        }
      } catch (error) {
        showAlert(alertBox, error.message || 'Unable to sign in.');
      }
    });
  }

  if (signUpForm) {
    signUpForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = signUpForm.querySelector('[name="name"]').value.trim();
      const email = signUpForm.querySelector('[name="email"]').value.trim();
      const password = signUpForm.querySelector('[name="password"]').value.trim();
      const alertBox = document.querySelector('#sign-up-alert');
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Registration failed');
        }
        const result = await response.json();
        showAlert(alertBox, result.message || 'Account created successfully.', 'success');
        setTimeout(() => {
          window.location.href = '/pages/auth/sign_in.html';
        }, 1800);
      } catch (error) {
        showAlert(alertBox, error.message || 'Unable to register.');
      }
    });
  }
});

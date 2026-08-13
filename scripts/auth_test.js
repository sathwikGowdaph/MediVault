const API = 'http://localhost:5000';

async function register() {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test+1@example.com', password: 'password123' })
  });
  const data = await res.json();
  console.log('register:', data);
}

async function login(password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test+1@example.com', password })
  });
  const text = await res.text();
  try { console.log('login:', JSON.parse(text)); } catch (e) { console.log('login raw:', text); }
}

async function logout(refreshToken) {
  const res = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-refresh-token': refreshToken }
  });
  const data = await res.json();
  console.log('logout:', data);
}

(async () => {
  await register();
  console.log('Attempt 1 (wrong)'); await login('wrongpass');
  await new Promise(r => setTimeout(r, 200));
  console.log('Attempt 2 (wrong)'); await login('wrongpass');
  await new Promise(r => setTimeout(r, 400));
  console.log('Attempt 3 (wrong)'); await login('wrongpass');
  await new Promise(r => setTimeout(r, 800));
  console.log('Attempt 4 (correct)'); await login('password123');
  await new Promise(r => setTimeout(r, 200));
  console.log('Logging out');
  await logout('');
  await new Promise(r => setTimeout(r, 200));
  console.log('Login after logout (correct)'); await login('password123');
})();

document.addEventListener('DOMContentLoaded', () => {
    let isRegisterMode = false;

    const authForm = document.getElementById('auth-form');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const toggleBtn = document.getElementById('toggle-btn');
    const toggleMsg = document.getElementById('toggle-msg');

    const usernameGroup = document.getElementById('username-group');
    const roleGroup = document.getElementById('role-group');

    const authBox = document.getElementById('auth-box');
    const dashboardBox = document.getElementById('dashboard-box');

    // Toggle between Login and Register Form
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isRegisterMode = !isRegisterMode;

            if (isRegisterMode) {
                formTitle.innerText = 'Register';
                submitBtn.innerText = 'Sign Up';
                toggleMsg.innerText = 'Already have an account?';
                toggleBtn.innerText = 'Login here';
                if (usernameGroup) usernameGroup.style.display = 'flex';
                if (roleGroup) roleGroup.style.display = 'flex';
            } else {
                formTitle.innerText = 'Login';
                submitBtn.innerText = 'Login';
                toggleMsg.innerText = "Don't have an account?";
                toggleBtn.innerText = 'Register here';
                if (usernameGroup) usernameGroup.style.display = 'none';
                if (roleGroup) roleGroup.style.display = 'none';
            }
        });
    }

    // Form Submission (Login / Register Handling)
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const username = document.getElementById('username') ? document.getElementById('username').value : '';
            const role = document.getElementById('role') ? document.getElementById('role').value : 'user';

            const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
            const payload = isRegisterMode ? { username, email, password, role } : { email, password };

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    if (!isRegisterMode) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        loadDashboard();
                    } else {
                        if (toggleBtn) toggleBtn.click();
                    }
                } else {
                    alert(data.message || 'Error occurred');
                }
            } catch (err) {
                console.error(err);
                alert('Server Connection Error!');
            }
        });
    }

    // Load Dashboard View based on Role
    function loadDashboard() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        if (authBox) authBox.style.display = 'none';
        if (dashboardBox) dashboardBox.style.display = 'block';

        const nameDisplay = document.getElementById('user-display-name');
        const roleDisplay = document.getElementById('user-display-role');
        if (nameDisplay) nameDisplay.innerText = user.username;
        if (roleDisplay) roleDisplay.innerText = user.role.toUpperCase();

        const roleContent = document.getElementById('role-content');
        if (roleContent) {
            if (user.role === 'admin') {
                roleContent.innerHTML = `
                    <div style="background: #e2f0d9; padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <h4>⚡ Admin Control Panel</h4>
                        <p>You have full access to manage platform settings.</p>
                    </div>
                `;
            } else {
                roleContent.innerHTML = `
                    <div style="background: #e6f2ff; padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <h4>👤 User Dashboard</h4>
                        <p>Welcome! You can view items and participate in live chat.</p>
                    </div>
                `;
            }
        }
    }

    // Logout Action
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            if (authBox) authBox.style.display = 'block';
            if (dashboardBox) dashboardBox.style.display = 'none';
        });
    }

    // Auto Check Login Status on Page Load
    if (localStorage.getItem('token')) {
        loadDashboard();
    }

    // --- Socket.io Real-Time Client Logic ---
    const socket = io();

    const chatForm = document.getElementById('chat-form');
    const msgInput = document.getElementById('msg-input');
    const messagesDiv = document.getElementById('messages');

    socket.on('message', (data) => {
        const msgElement = document.createElement('div');
        msgElement.style.margin = '4px 0';
        msgElement.innerHTML = `<strong>${data.user}</strong> <small style="color: #666;">(${data.time})</small>: ${data.text}`;
        messagesDiv.appendChild(msgElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr).username : 'Anonymous';

            if (msgInput.value.trim() !== '') {
                socket.emit('chatMessage', {
                    user: user,
                    text: msgInput.value
                });
                msgInput.value = '';
            }
        });
    }
});
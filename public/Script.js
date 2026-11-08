// API URLs
const API_ITEMS_URL = '/api/items';
const API_AUTH_URL = '/api/auth';

// Items Management
function loadItems() {
    const listElement = document.getElementById('item-list');
    if (!listElement) return;

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user && user.role === 'admin';

    fetch(API_ITEMS_URL)
        .then(res => res.json())
        .then(data => {
            listElement.innerHTML = '';
            if (!Array.isArray(data) || data.length === 0) {
                listElement.innerHTML = '<li class="empty-msg">No items found. Add your first item!</li>';
                return;
            }

            data.forEach(item => {
                const li = document.createElement('li');
                li.className = 'item-row';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = item.name;
                li.appendChild(nameSpan);

                // Admin or user can delete items
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '✕';
                deleteBtn.className = 'delete-btn';
                deleteBtn.title = 'Delete item';
                deleteBtn.onclick = () => deleteItem(item.id);
                li.appendChild(deleteBtn);

                listElement.appendChild(li);
            });
        })
        .catch(err => console.error('Error fetching items:', err));
}

function addItem() {
    const inputField = document.getElementById('item-input');
    if (!inputField) return;

    const itemName = inputField.value.trim();
    if (!itemName) {
        alert('Please enter an item name!');
        return;
    }

    fetch(API_ITEMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: itemName })
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to add item');
        return res.json();
    })
    .then(() => {
        inputField.value = '';
        loadItems();
    })
    .catch(err => {
        console.error('Error adding item:', err);
        alert('Could not add item: ' + err.message);
    });
}

function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    fetch(`${API_ITEMS_URL}/${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to delete item');
        return res.json();
    })
    .then(() => {
        loadItems();
    })
    .catch(err => {
        console.error('Error deleting item:', err);
        alert('Could not delete item: ' + err.message);
    });
}

// Attach to window so HTML onclick handlers can access them
window.addItem = addItem;
window.deleteItem = deleteItem;
window.loadItems = loadItems;

// DOM Initialization
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

    // Toggle between Login and Register modes
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

    // Auth Form Submission (Login / Register)
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const username = document.getElementById('username') ? document.getElementById('username').value.trim() : '';
            const role = document.getElementById('role') ? document.getElementById('role').value : 'user';

            const endpoint = isRegisterMode ? `${API_AUTH_URL}/register` : `${API_AUTH_URL}/login`;
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
                        // Switch to Login form after registration
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

    // Load Dashboard View based on Authenticated User
    function loadDashboard() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        if (authBox) authBox.style.display = 'none';
        if (dashboardBox) dashboardBox.style.display = 'block';

        const nameDisplay = document.getElementById('user-display-name');
        const roleDisplay = document.getElementById('user-display-role');
        if (nameDisplay) nameDisplay.innerText = user.username || 'User';
        if (roleDisplay) {
            roleDisplay.innerText = (user.role || 'user').toUpperCase();
            roleDisplay.className = user.role === 'admin' ? 'role-badge badge-admin' : 'role-badge badge-user';
        }

        const roleContent = document.getElementById('role-content');
        if (roleContent) {
            if (user.role === 'admin') {
                roleContent.innerHTML = `
                    <div class="panel-box admin-panel">
                        <h4>⚡ Admin Control Panel</h4>
                        <p>You have administrative privileges: manage, create, and delete items.</p>
                    </div>
                `;
            } else {
                roleContent.innerHTML = `
                    <div class="panel-box user-panel">
                        <h4>👤 User Dashboard</h4>
                        <p>Welcome! You can view and manage items in your inventory.</p>
                    </div>
                `;
            }
        }

        // Load items from MySQL into the dashboard
        loadItems();
    }

    // Logout Action
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (authBox) authBox.style.display = 'block';
            if (dashboardBox) dashboardBox.style.display = 'none';
        });
    }

    // Auto Check Login Status on Page Load
    if (localStorage.getItem('token') && localStorage.getItem('user')) {
        loadDashboard();
    }
});

/* app-auth.js - Authentication Service */
(function (global) {
    const LS_USERS = 'users_db_v1';
    const LS_CURR = 'current_user_id';
    const LS_ROLE = 'role';
    const LS_NAME = 'username';

    function loadUsers() {
        try {
            const raw = localStorage.getItem(LS_USERS);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    function saveUsers(users) {
        localStorage.setItem(LS_USERS, JSON.stringify(users));
    }

    const AppAuth = {
        loadUsers: loadUsers,

        // Helper mostly for debugging or external checks
        hasUsers: function () {
            return loadUsers().length > 0;
        },

        login: async function ({ email, password }) {
            // Simulate network delay
            await new Promise(r => setTimeout(r, 400));

            const users = loadUsers();
            // Case-insensitive email check? Usually strict usually but let's be standard strict
            const u = users.find(x => x.email === email && x.password === password);
            if (!u) {
                throw new Error('Credenciales incorrectas.');
            }

            // Save session
            localStorage.setItem(LS_CURR, u.id);
            localStorage.setItem(LS_ROLE, u.role);
            localStorage.setItem(LS_NAME, u.name);

            return { id: u.id, role: u.role, name: u.name };
        },

        register: async function ({ name, email, password, role }) {
            await new Promise(r => setTimeout(r, 400));

            const users = loadUsers();
            if (users.some(x => x.email === email)) {
                throw new Error('El correo ya está registrado.');
            }

            const newUser = {
                id: 'u-' + Date.now(),
                name,
                email,
                password,
                role
            };
            users.push(newUser);
            saveUsers(users);

            // Auto login
            localStorage.setItem(LS_CURR, newUser.id);
            localStorage.setItem(LS_ROLE, newUser.role);
            localStorage.setItem(LS_NAME, newUser.name);

            return newUser;
        },

        roleHome: function (role) {
            switch (role) {
                case 'conductor': return 'aplicacionConductor.html';
                case 'cliente': return 'gestiondeRutas.html';
                // admin or administrative
                default: return 'dashboard.html';
            }
        },

        logout: function () {
            localStorage.removeItem(LS_CURR);
            localStorage.removeItem(LS_ROLE);
            localStorage.removeItem(LS_NAME);
            window.location.href = 'inicioSesion.html';
        }
    };

    // Expose to window
    global.AppAuth = AppAuth;
})(window);

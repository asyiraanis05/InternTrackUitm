
const USERS_KEY = "interntrack_users";

// Get users
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

// Save users
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Create demo accounts
function createDemoAccounts() {
    let users = getUsers();

    if (!users.some(user => user.email.toLowerCase() === "student@uitm.edu.my")) {
        users.push({
            name: "Demo Student",
            studentId: "2026123456",
            email: "student@uitm.edu.my",
            password: "student123",
            programme: "Information Systems",
            faculty: "Faculty of Information Science",
            campus: "UiTM Machang",
            phone: "",
            role: "student"
        });
    }

    if (!users.some(user => user.email.toLowerCase() === "admin@uitm.edu.my")) {
        users.push({
            name: "UiTM Administrator",
            email: "admin@uitm.edu.my",
            password: "admin123",
            role: "admin"
        });
    }

    saveUsers(users);
}

createDemoAccounts();

// Login
// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        const users = getUsers();

        const userIndex = users.findIndex(function(item) {
            return item.email.toLowerCase() === email &&
                   item.password === password;
        });

        if (userIndex === -1) {
            document.getElementById("loginAlert").innerHTML =
                '<div class="alert alert-danger">Incorrect email or password.</div>';
            return;
        }

        // Save last login time
        users[userIndex].lastLogin = new Date().toISOString();
        users[userIndex].loginCount =
            (Number(users[userIndex].loginCount) || 0) + 1;

        saveUsers(users);

        const user = users[userIndex];

        localStorage.setItem("interntrack_session", JSON.stringify({
            email: user.email,
            role: user.role
        }));

        if (user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "student.html";
        }
    });
}

// Student registration
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function(event) {
        event.preventDefault();

        let users = getUsers();

        const email = document.getElementById("regEmail").value.trim().toLowerCase();

        if (users.some(user => user.email.toLowerCase() === email)) {
            document.getElementById("registerAlert").innerHTML =
                '<div class="alert alert-danger">Email already registered.</div>';
            return;
        }

        
const newUser = {
    name: document.getElementById("regName").value.trim(),
    studentId: document.getElementById("regId").value.trim(),
    email: email,
    password: document.getElementById("regPassword").value,
    programme: document.getElementById("regProgramme").value,
    faculty: document.getElementById("regFaculty").value,
    campus: document.getElementById("regCampus").value,
    phone: document.getElementById("regPhone").value.trim(),

    lastLogin: new Date().toISOString(),
    loginCount: 1,

    role: "student"
};


        users.push(newUser);
        saveUsers(users);

        localStorage.setItem("interntrack_session", JSON.stringify({
            email: email,
            role: "student"
        }));

        window.location.href = "student.html";
    });
}

// Protect student and admin pages
document.addEventListener("DOMContentLoaded", function() {
    const session = JSON.parse(
        localStorage.getItem("interntrack_session")
    );

    const currentPage = window.location.pathname.split("/").pop();

    const studentPages = [
        "student.html",
        "my-application.html",
        "student-records.html",
        "profile.html"
    ];

    const adminPages = [
        "admin.html",
        "admin-applications.html",
        "admin-reports.html"
    ];

    if (!session) {
        if (studentPages.includes(currentPage) || adminPages.includes(currentPage)) {
            window.location.href = "index.html";
        }
        return;
    }

    if (studentPages.includes(currentPage) && session.role !== "student") {
        window.location.href = "admin.html";
    }

    if (adminPages.includes(currentPage) && session.role !== "admin") {
        window.location.href = "student.html";
    }
});

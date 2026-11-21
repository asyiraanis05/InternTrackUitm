
// ========================================
// INTERNTRACK UiTM - MAIN APPLICATION
// ========================================

const APPLICATIONS_KEY = "interntrack_applications";
const SESSION_KEY = "interntrack_session";
const USERS_KEY_APP = "interntrack_users";

// ========================================
// GENERAL FUNCTIONS
// ========================================

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (error) {
        return null;
    }
}

function getCurrentUser() {
    const session = getSession();

    if (!session) return null;

    const users = JSON.parse(localStorage.getItem(USERS_KEY_APP)) || [];

    return users.find(user => user.email === session.email) || null;
}

function getApplications() {
    try {
        return JSON.parse(localStorage.getItem(APPLICATIONS_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveApplications(applications) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
}

// LOGOUT FUNCTION
// Make it available to HTML onclick="logout()"
window.logout = function () {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
};

function protectPage(requiredRole) {
    const session = getSession();

    if (!session) {
        window.location.href = "index.html";
        return false;
    }

    if (session.role !== requiredRole) {
        window.location.href =
            session.role === "admin" ? "admin.html" : "student.html";

        return false;
    }

    return true;
}

function statusBadge(status) {
    if (status === "Approved") {
        return '<span class="badge badge-approved">Approved</span>';
    }

    if (status === "Rejected") {
        return '<span class="badge badge-rejected">Rejected</span>';
    }

    return '<span class="badge badge-pending">Pending</span>';
}

function formatDate(date) {
    if (!date) return "-";

    return new Date(date + "T00:00:00").toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function generateApplicationId() {
    return "IT-" + Date.now().toString().slice(-8);
}

// ========================================
// STUDENT DASHBOARD
// ========================================

function loadStudentDashboard() {
    if (!protectPage("student")) return;

    const user = getCurrentUser();

    if (!user) return;

    const applications = getApplications().filter(
        app => app.studentEmail === user.email
    );

    const welcome = document.getElementById("studentWelcome");
    const total = document.getElementById("totalApplications");
    const pending = document.getElementById("pendingApplications");
    const approved = document.getElementById("approvedApplications");

    if (welcome) welcome.textContent = user.name || "";
    if (total) total.textContent = applications.length;

    if (pending) {
        pending.textContent =
            applications.filter(app => app.status === "Pending").length;
    }

    if (approved) {
        approved.textContent =
            applications.filter(app => app.status === "Approved").length;
    }

    const latest = [...applications].sort(
        (a, b) => b.createdAt - a.createdAt
    )[0];

    const latestContainer = document.getElementById("latestApplication");

    if (!latestContainer) return;

    if (!latest) {
        latestContainer.innerHTML =
            '<p class="text-secondary mb-0">You have not submitted any application yet.</p>';
        return;
    }

    latestContainer.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <small class="text-secondary">Application ID</small>
                <p class="fw-bold">${escapeHTML(latest.id)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Preferred Department</small>
                <p class="fw-bold">${escapeHTML(latest.preferredDepartment)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Duration</small>
                <p>${escapeHTML(latest.duration)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Status</small>
                <p>${statusBadge(latest.status)}</p>
            </div>

            <div class="col-12">
                <small class="text-secondary">Admin Comment</small>
                <p>${escapeHTML(latest.adminComment || "No comment yet.")}</p>
            </div>
        </div>
    `;
}

// ========================================
// STUDENT APPLICATION FORM
// ========================================

function loadApplicationForm() {
    if (!protectPage("student")) return;

    const user = getCurrentUser();

    if (!user) return;

    const departmentSelect = document.getElementById("preferredDepartment");
    const form = document.getElementById("applicationForm");

    if (!departmentSelect || !form) return;

    departmentSelect.addEventListener("change", function () {
        const otherGroup = document.getElementById("otherDepartmentGroup");
        const otherInput = document.getElementById("otherDepartment");

        if (this.value === "Other") {
            otherGroup.style.display = "block";
            otherInput.required = true;
        } else {
            otherGroup.style.display = "none";
            otherInput.required = false;
            otherInput.value = "";
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        // One application per student account
        const applications = getApplications();

        const alreadyApplied = applications.some(
            app => app.studentEmail === user.email
        );

        if (alreadyApplied) {
            showAlert(
                "applicationAlert",
                "You have already submitted an application. Only one application is allowed per student.",
                "warning"
            );
            return;
        }

        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (new Date(endDate) <= new Date(startDate)) {
            showAlert(
                "applicationAlert",
                "End date must be later than start date.",
                "danger"
            );
            return;
        }

        let preferredDepartment = departmentSelect.value;

        if (preferredDepartment === "Other") {
            preferredDepartment =
                document.getElementById("otherDepartment").value.trim();

            if (!preferredDepartment) {
                showAlert(
                    "applicationAlert",
                    "Please specify your preferred department.",
                    "danger"
                );
                return;
            }
        }

        const newApplication = {
            id: generateApplicationId(),

            studentName: document.getElementById("appStudentName").value.trim(),
            studentId: document.getElementById("appStudentId").value.trim(),
            studentEmail: user.email,

            programme: document.getElementById("appProgramme").value.trim(),
            faculty: user.faculty || "",
            campus: document.getElementById("appCampus").value.trim(),

            preferredDepartment: preferredDepartment,

            duration: document.getElementById("internshipDuration").value,

            startDate: startDate,
            endDate: endDate,

            notes: document.getElementById("applicationNotes").value,

            status: "Pending",

            finalDepartment: "",
            adminComment: "",

            createdAt: Date.now(),
            submittedDate: new Date().toISOString().split("T")[0]
        };

        applications.push(newApplication);

        saveApplications(applications);

        showAlert(
            "applicationAlert",
            "Your internship application has been submitted successfully!",
            "success"
        );

        form.reset();

        document.getElementById("otherDepartmentGroup").style.display = "none";

        loadMyApplications();
    });

    loadMyApplications();
}

// ========================================
// STUDENT APPLICATION HISTORY
// ========================================

function loadMyApplications() {
    const user = getCurrentUser();

    if (!user) return;

    const applications = getApplications()
        .filter(app => app.studentEmail === user.email)
        .sort((a, b) => b.createdAt - a.createdAt);

    const tbody = document.getElementById("myApplicationsTable");

    if (!tbody) return;

    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary">
                    No applications submitted.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td>${formatDate(app.submittedDate)}</td>
            <td>${escapeHTML(app.preferredDepartment)}</td>
            <td>${escapeHTML(app.duration)}</td>
            <td>${statusBadge(app.status)}</td>
            <td>${escapeHTML(app.adminComment || "No comment yet.")}</td>
        </tr>
    `).join("");
}

// ========================================
// STUDENT PLACEMENT RECORDS
// ========================================

function loadPlacementRecords() {
    if (!protectPage("student")) return;

    const user = getCurrentUser();

    if (!user) return;

    const approvedApplications = getApplications().filter(app =>
        app.studentEmail === user.email &&
        app.status === "Approved"
    );

    const tbody = document.getElementById("placementRecordsTable");

    if (!tbody) return;

    if (approvedApplications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary">
                    No approved placement records yet.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = approvedApplications.map(app => `
        <tr>
            <td>${escapeHTML(app.id)}</td>
            <td>${escapeHTML(app.finalDepartment || app.preferredDepartment)}</td>
            <td>${escapeHTML(app.duration)}</td>
            <td>${formatDate(app.startDate)}</td>
            <td>${formatDate(app.endDate)}</td>
            <td>${statusBadge(app.status)}</td>
        </tr>
    `).join("");
}

// ========================================
// STUDENT PROFILE
// ========================================

function loadStudentProfile() {
    if (!protectPage("student")) return;

    const user = getCurrentUser();

    if (!user) return;

    document.getElementById("profileName").value = user.name || "";
    document.getElementById("profileStudentId").value = user.studentId || "";
    document.getElementById("profileEmail").value = user.email || "";
    document.getElementById("profilePhone").value = user.phone || "";
    document.getElementById("profileProgramme").value = user.programme || "";
    document.getElementById("profileFaculty").value = user.faculty || "";
    document.getElementById("profileCampus").value = user.campus || "";

    const profileForm = document.getElementById("profileForm");

    if (!profileForm) return;

    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const users = JSON.parse(localStorage.getItem(USERS_KEY_APP)) || [];
        const oldEmail = user.email;

        const index = users.findIndex(item => item.email === oldEmail);

        if (index === -1) {
            showAlert(
                "profileAlert",
                "Unable to find your account. Please log in again.",
                "danger"
            );
            return;
        }

        const updatedEmail =
            document.getElementById("profileEmail").value.trim();

        const emailAlreadyUsed = users.some((item, userIndex) =>
            userIndex !== index &&
            item.email.toLowerCase() === updatedEmail.toLowerCase()
        );

        if (emailAlreadyUsed) {
            showAlert(
                "profileAlert",
                "This email address is already registered.",
                "danger"
            );
            return;
        }

        users[index].name =
            document.getElementById("profileName").value.trim();

        users[index].studentId =
            document.getElementById("profileStudentId").value.trim();

        users[index].email = updatedEmail;

        users[index].phone =
            document.getElementById("profilePhone").value.trim();

        users[index].programme =
            document.getElementById("profileProgramme").value.trim();

        users[index].faculty =
            document.getElementById("profileFaculty").value.trim();

        users[index].campus =
            document.getElementById("profileCampus").value.trim();

        localStorage.setItem(USERS_KEY_APP, JSON.stringify(users));

        // Update current login session
        localStorage.setItem(SESSION_KEY, JSON.stringify(users[index]));

        // Update email in existing applications
        const applications = getApplications();

        applications.forEach(app => {
            if (app.studentEmail === oldEmail) {
                app.studentEmail = updatedEmail;
            }
        });

        saveApplications(applications);

        showAlert(
            "profileAlert",
            "Profile updated successfully!",
            "success"
        );
    });
}
// ========================================
// ADMIN STUDENT USER ACTIVITY
// ========================================

function loadStudentActivity() {
    const users = JSON.parse(
        localStorage.getItem(USERS_KEY_APP)
    ) || [];

    const applications = getApplications();

   const students = users.filter(user =>
    user.role === "student" &&
    user.email !== "student@uitm.edu.my"
);

    const tbody = document.getElementById("studentActivityTable");
    const totalStudents = document.getElementById("totalRegisteredStudents");

    if (totalStudents) {
        totalStudents.textContent = students.length + " Students";
    }

    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary">
                    No registered students found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = students.map(user => {
        const application = applications.find(
            app => app.studentEmail.toLowerCase() === user.email.toLowerCase()
        );

        let applicationStatus = application
            ? statusBadge(application.status)
            : '<span class="badge bg-secondary">No Application</span>';

        let lastLogin = "Never logged in";

        if (user.lastLogin) {
            lastLogin = new Date(user.lastLogin).toLocaleString("en-MY", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        return `
            <tr>
                <td>${escapeHTML(user.name || "-")}</td>
                <td>${escapeHTML(user.studentId || "-")}</td>
                <td>${escapeHTML(user.email || "-")}</td>
                <td>${applicationStatus}</td>
                <td>${escapeHTML(lastLogin)}</td>
            </tr>
        `;
    }).join("");
}
// ========================================
// ADMIN DASHBOARD
// ========================================

function loadAdminDashboard() {
    if (!protectPage("admin")) return;
    
    loadStudentActivity();
    
    const applications = getApplications();

    const pending = applications.filter(app => app.status === "Pending").length;
    const approved = applications.filter(app => app.status === "Approved").length;
    const rejected = applications.filter(app => app.status === "Rejected").length;

    document.getElementById("adminTotal").textContent = applications.length;
    document.getElementById("adminPending").textContent = pending;
    document.getElementById("adminApproved").textContent = approved;
    document.getElementById("adminRejected").textContent = rejected;

    const tbody = document.getElementById("adminRecentApplications");

    const recent = [...applications]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    if (!tbody) return;

    if (recent.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-secondary">
                    No applications found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = recent.map(app => `
        <tr>
            <td>
                <strong>${escapeHTML(app.studentName)}</strong><br>
                <small class="text-secondary">${escapeHTML(app.studentId || "")}</small>
            </td>
            <td>${escapeHTML(app.preferredDepartment)}</td>
            <td>${escapeHTML(app.duration)}</td>
            <td>${statusBadge(app.status)}</td>
        </tr>
    `).join("");
}

// ========================================
// ADMIN APPLICATION MANAGEMENT
// ========================================

function loadAdminApplications() {
    if (!protectPage("admin")) return;

    const searchInput = document.getElementById("adminSearch");
    const statusFilter = document.getElementById("statusFilter");

    renderAdminApplications();

    if (searchInput) {
        searchInput.addEventListener("input", renderAdminApplications);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderAdminApplications);
    }
}

function renderAdminApplications() {
    const applications = getApplications()
        .sort((a, b) => b.createdAt - a.createdAt);

    const searchInput = document.getElementById("adminSearch");
    const statusInput = document.getElementById("statusFilter");
    const tbody = document.getElementById("adminApplicationsTable");

    if (!tbody || !searchInput || !statusInput) return;

    const search = searchInput.value.toLowerCase();
    const status = statusInput.value;

    const filtered = applications.filter(app => {
        const matchesSearch =
            (app.studentName || "").toLowerCase().includes(search) ||
            String(app.studentId || "").toLowerCase().includes(search) ||
            (app.preferredDepartment || "").toLowerCase().includes(search);

        const matchesStatus =
            status === "All" || app.status === status;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-secondary">
                    No matching applications found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(app => `
        <tr>
            <td>${escapeHTML(app.id)}</td>
            <td>
                <strong>${escapeHTML(app.studentName)}</strong><br>
                <small class="text-secondary">${escapeHTML(app.studentId || "")}</small>
            </td>
            <td>${escapeHTML(app.preferredDepartment)}</td>
            <td>${escapeHTML(app.duration)}</td>
            <td>${formatDate(app.submittedDate)}</td>
            <td>${statusBadge(app.status)}</td>
            <td>
                <button class="btn btn-sm btn-primary"
                    onclick="openReview('${app.id}')">
                    Review
                </button>
            </td>
        </tr>
    `).join("");
}

// ========================================
// OPEN REVIEW MODAL
// ========================================

function openReview(applicationId) {
    const applications = getApplications();

    const app = applications.find(item => item.id === applicationId);

    if (!app) return;

    document.getElementById("reviewApplicationId").value = app.id;

    document.getElementById("reviewDetails").innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <small class="text-secondary">Student Name</small>
                <p class="fw-bold">${escapeHTML(app.studentName)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Student ID</small>
                <p class="fw-bold">${escapeHTML(app.studentId || "-")}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Email</small>
                <p>${escapeHTML(app.studentEmail)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Programme</small>
                <p>${escapeHTML(app.programme || "-")}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Faculty</small>
                <p>${escapeHTML(app.faculty || "-")}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Campus</small>
                <p>${escapeHTML(app.campus || "-")}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Preferred Department</small>
                <p>${escapeHTML(app.preferredDepartment)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Duration</small>
                <p>${escapeHTML(app.duration)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">Start Date</small>
                <p>${formatDate(app.startDate)}</p>
            </div>

            <div class="col-md-6">
                <small class="text-secondary">End Date</small>
                <p>${formatDate(app.endDate)}</p>
            </div>

            <div class="col-12">
                <small class="text-secondary">Student Notes</small>
                <p>${escapeHTML(app.notes || "No additional notes.")}</p>
            </div>
        </div>
    `;

    const finalDepartment = document.getElementById("finalDepartment");

    const standardDepartments = [
        "Information Technology Department",
        "Human Resource Department",
        "Finance Department",
        "Academic Affairs Department",
        "Student Affairs Department",
        "Corporate Communication Unit",
        "Library Department",
        "Administration Department",
        "Research and Innovation Unit"
    ];

    if (standardDepartments.includes(app.finalDepartment)) {
        finalDepartment.value = app.finalDepartment;
        document.getElementById("finalOtherDepartmentGroup").style.display = "none";
    } else if (app.finalDepartment) {
        finalDepartment.value = "Other";
        document.getElementById("finalOtherDepartmentGroup").style.display = "block";
        document.getElementById("finalOtherDepartment").value = app.finalDepartment;
    } else {
        finalDepartment.value = "";
        document.getElementById("finalOtherDepartmentGroup").style.display = "none";
        document.getElementById("finalOtherDepartment").value = "";
    }

    document.getElementById("reviewStatus").value = app.status;
    document.getElementById("adminComment").value = app.adminComment || "";

    new bootstrap.Modal(document.getElementById("reviewModal")).show();
}

// Make Review function available to HTML onclick
window.openReview = openReview;

// ========================================
// ADMIN SAVE DECISION
// ========================================

function setupReviewForm() {
    const form = document.getElementById("reviewForm");

    if (!form) return;

    const finalDepartment = document.getElementById("finalDepartment");

    if (!finalDepartment) return;

    finalDepartment.addEventListener("change", function () {
        const otherGroup =
            document.getElementById("finalOtherDepartmentGroup");

        const otherInput =
            document.getElementById("finalOtherDepartment");

        if (this.value === "Other") {
            otherGroup.style.display = "block";
            otherInput.required = true;
        } else {
            otherGroup.style.display = "none";
            otherInput.required = false;
            otherInput.value = "";
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const applicationId =
            document.getElementById("reviewApplicationId").value;

        const applications = getApplications();

        const index = applications.findIndex(app => app.id === applicationId);

        if (index === -1) return;

        const decision =
            document.getElementById("reviewStatus").value;

        let department = finalDepartment.value;

        if (department === "Other") {
            department =
                document.getElementById("finalOtherDepartment").value.trim();

            if (!department) {
                alert("Please specify the final placement department.");
                return;
            }
        }

        if (decision === "Approved" && !department) {
            alert("Please select the final placement department before approving.");
            return;
        }

        applications[index].status = decision;

        applications[index].finalDepartment =
            decision === "Approved" ? department : "";

        applications[index].adminComment =
            document.getElementById("adminComment").value.trim();

        applications[index].reviewedAt = new Date().toISOString();

        saveApplications(applications);

        const modalElement = document.getElementById("reviewModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);

        if (modalInstance) modalInstance.hide();

        showAlert(
            "adminApplicationAlert",
            "Application decision saved successfully.",
            "success"
        );

        renderAdminApplications();
    });
}

// ========================================
// ADMIN REPORTS
// ========================================

function loadAdminReports() {
    if (!protectPage("admin")) return;

    const applications = getApplications();

    const pending =
        applications.filter(app => app.status === "Pending").length;

    const approved =
        applications.filter(app => app.status === "Approved").length;

    const rejected =
        applications.filter(app => app.status === "Rejected").length;

    const statusCanvas = document.getElementById("statusChart");

    if (statusCanvas && typeof Chart !== "undefined") {
        new Chart(statusCanvas, {
            type: "doughnut",
            data: {
                labels: ["Pending", "Approved", "Rejected"],
                datasets: [{
                    data: [pending, approved, rejected]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });
    }

    const departmentCounts = {};

    applications.forEach(app => {
        const department = app.preferredDepartment || "Not specified";

        departmentCounts[department] =
            (departmentCounts[department] || 0) + 1;
    });

    const departmentNames = Object.keys(departmentCounts);
    const departmentValues = Object.values(departmentCounts);

    const departmentCanvas =
        document.getElementById("departmentChart");

    if (departmentCanvas && typeof Chart !== "undefined") {
        new Chart(departmentCanvas, {
            type: "bar",
            data: {
                labels: departmentNames,
                datasets: [{
                    label: "Number of Applications",
                    data: departmentValues
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    const tbody =
        document.getElementById("departmentSummaryTable");

    if (!tbody) return;

    if (departmentNames.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-secondary">
                    No data available.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = departmentNames.map(name => `
        <tr>
            <td>${escapeHTML(name)}</td>
            <td>${departmentCounts[name]}</td>
        </tr>
    `).join("");
}

// ========================================
// GENERAL HELPER FUNCTIONS
// ========================================

function showAlert(elementId, message, type) {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${escapeHTML(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

// ========================================
// PAGE INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    if (document.getElementById("studentWelcome")) {
        loadStudentDashboard();
    }

    if (document.getElementById("applicationForm")) {
        loadApplicationForm();
    }

    if (document.getElementById("placementRecordsTable")) {
        loadPlacementRecords();
    }

    if (document.getElementById("profileForm")) {
        loadStudentProfile();
    }

    if (document.getElementById("adminTotal")) {
        loadAdminDashboard();
    }

    if (document.getElementById("adminApplicationsTable")) {
        loadAdminApplications();
        setupReviewForm();
    }

    if (document.getElementById("statusChart")) {
        loadAdminReports();
    }

});

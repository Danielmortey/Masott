document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const uploadForm = document.getElementById('upload-form');
    const designsTableBody = document.querySelector('#designs-table tbody');

    // Check if logged in (simple check by trying to load designs table with delete buttons)
    // Actually, we'll let the user log in first.
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        if (res.ok) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadAdminDesigns();
        } else {
            document.getElementById('login-error').innerText = "Incorrect Password!";
        }
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    });

    // Handle File Upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('design-name').value;
        const fileInput = document.getElementById('design-photos');
        const files = fileInput.files;
        const statusEl = document.getElementById('upload-status');

        if (files.length < 2 || files.length > 4) {
            statusEl.innerText = "Error: Please select between 2 and 4 images.";
            statusEl.style.color = "red";
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        for (let i = 0; i < files.length; i++) {
            formData.append('photos', files[i]);
        }

        statusEl.innerText = "Uploading...";
        statusEl.style.color = "black";

        const res = await fetch('/api/designs', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            statusEl.innerText = "Design uploaded successfully!";
            statusEl.style.color = "green";
            uploadForm.reset();
            loadAdminDesigns();
        } else {
            const data = await res.json();
            statusEl.innerText = data.error || "Upload failed.";
            statusEl.style.color = "red";
        }
    });

    // Load table data
    // --- REPLACE YOUR loadAdminDesigns AND ADD editDesign IN admin.js ---

const loadAdminDesigns = async () => {
    try {
        const res = await fetch('/api/designs');
        const designs = await res.json();
        
        designsTableBody.innerHTML = designs.map(d => `
            <tr>
                <td><img src="${d.photos[0]}" class="thumb"></td>
                <td>${d.name}</td>
                <td>${d.photos.length}</td>
                <td>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <!-- EDIT BUTTON -->
                        <button class="edit-btn" onclick="editDesign('${d.id}', '${d.name}')" style="background:none; border:none; color: #2196F3; cursor:pointer; font-size: 1.2rem;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        
                        <!-- DELETE BUTTON -->
                        <button class="delete-btn" onclick="deleteDesign('${d.id}')" style="background:none; border:none; color: #f44336; cursor:pointer; font-size: 1.2rem;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error loading designs:", error);
    }
};

// New function to handle Editing (Renaming)
window.editDesign = async (id, oldName) => {
    const newName = prompt("Enter the new name for this design:", oldName);
    
    // If user cancels or enters empty name, do nothing
    if (newName === null || newName.trim() === "") return;

    // If the name is actually different, send to server
    if (newName.trim() !== oldName) {
        const res = await fetch(`/api/designs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
        });

        if (res.ok) {
            loadAdminDesigns(); // Refresh the table
        } else {
            alert("Failed to update the design name.");
        }
    }
};
    // Expose delete function to window
    window.deleteDesign = async (id) => {
        if (!confirm("Are you sure you want to delete this design?")) return;
        
        const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadAdminDesigns();
        } else {
            alert("Failed to delete.");
        }
    };
});
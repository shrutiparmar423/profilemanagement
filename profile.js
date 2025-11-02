        // Global variables for pagination and search
        let allAdmins = [];
        let filteredAdmins = [];
        let currentPage = 1;
        const adminsPerPage = 5;

        // Mobile sidebar toggle
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const sidebar = document.getElementById('sidebar');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            
            if (window.innerWidth <= 768 && 
                !sidebar.contains(event.target) && 
                !mobileMenuBtn.contains(event.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Toggle password visibility
        function togglePasswordVisibility(inputId) {
            const input = document.getElementById(inputId);
            const toggle = document.getElementById(inputId + 'Toggle');
            
            if (input.type === 'password') {
                input.type = 'text';
                toggle.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                toggle.className = 'fas fa-eye';
            }
        }

        // Generate secure password
        function generatePassword() {
            const length = 12;
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            
            // Ensure at least one character from each category
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const symbols = '!@#$%^&*';
            
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += symbols[Math.floor(Math.random() * symbols.length)];
            
            // Fill the rest with random characters
            for (let i = 4; i < length; i++) {
                password += charset[Math.floor(Math.random() * charset.length)];
            }
            
            // Shuffle the password
            password = password.split('').sort(() => Math.random() - 0.5).join('');
            
            // Set the password and trigger validation
            const passwordInput = document.getElementById('adminPassword');
            const confirmInput = document.getElementById('confirmPassword');
            
            passwordInput.value = password;
            confirmInput.value = password;
            
            // Trigger password strength check
            checkPasswordStrength(password);
            
            // Show success message
            showSuccess('Secure password generated!');
        }

        // Password strength checker
        function checkPasswordStrength(password) {
            const strengthDiv = document.getElementById('passwordStrength');
            let strength = 0;
            let feedback = [];

            if (password.length >= 8) strength++;
            else feedback.push('at least 8 characters');

            if (/[A-Z]/.test(password)) strength++;
            else feedback.push('uppercase letter');

            if (/[a-z]/.test(password)) strength++;
            else feedback.push('lowercase letter');

            if (/[0-9]/.test(password)) strength++;
            else feedback.push('number');

            if (/[^A-Za-z0-9]/.test(password)) strength++;
            else feedback.push('special character');

            if (strength < 2) {
                strengthDiv.textContent = 'Weak password. Add: ' + feedback.join(', ');
                strengthDiv.className = 'password-strength strength-weak';
            } else if (strength < 4) {
                strengthDiv.textContent = 'Medium strength. Consider adding: ' + feedback.join(', ');
                strengthDiv.className = 'password-strength strength-medium';
            } else {
                strengthDiv.textContent = 'Strong password!';
                strengthDiv.className = 'password-strength strength-strong';
            }
        }

        // Load user info
        async function loadUserInfo() {
            try {
                const adminData = await App.apiFetch('/adminData', { method: 'GET' });
                
                if (adminData && adminData.user && adminData.user.username) {
                    document.getElementById('sidebarUserName').textContent = adminData.user.username;
                } else {
                    const email = localStorage.getItem('ff_email');
                    if (email) {
                        const username = email.split('@')[0];
                        document.getElementById('sidebarUserName').textContent = username;
                    } else {
                        document.getElementById('sidebarUserName').textContent = 'Admin User';
                    }
                }
            } catch (error) {
                console.error('Error loading user info:', error);
                const email = localStorage.getItem('ff_email');
                if (email) {
                    const username = email.split('@')[0];
                    document.getElementById('sidebarUserName').textContent = username;
                } else {
                    document.getElementById('sidebarUserName').textContent = 'Admin User';
                }
            }
        }

        // Load admin users
        async function loadAdminUsers() {
            try {
                console.log('Loading admin users...');
                const response = await App.apiFetch('/getAdminUsers', { method: 'GET' });
                console.log('Admin users response:', response);
                
                if (response && response.admins) {
                    allAdmins = response.admins;
                    filteredAdmins = [...allAdmins];
                    currentPage = 1;
                    
                    updateAdminDisplay();
                    updatePagination();
                    document.getElementById('adminCount').textContent = allAdmins.length;
                } else {
                    throw new Error('Invalid response format: ' + JSON.stringify(response));
                }
            } catch (error) {
                console.error('Error loading admin users:', error);
                let errorMessage = 'Failed to load admin accounts. Please try again.';
                
                if (error.message) {
                    errorMessage += ` (${error.message})`;
                }
                
                document.getElementById('adminList').innerHTML = `
                    <div class="error">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${errorMessage}
                    </div>
                `;
            }
        }

        // Update admin display with pagination
        function updateAdminDisplay() {
            const adminList = document.getElementById('adminList');
            const adminWarning = document.getElementById('adminWarning');
            const startIndex = (currentPage - 1) * adminsPerPage;
            const endIndex = startIndex + adminsPerPage;
            const currentAdmins = filteredAdmins.slice(startIndex, endIndex);
            
            // Show warning if only one admin left
            if (allAdmins.length === 1) {
                adminWarning.style.display = 'block';
            } else {
                adminWarning.style.display = 'none';
            }
            
            if (filteredAdmins.length === 0) {
                adminList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-shield"></i>
                        <h3>${allAdmins.length === 0 ? 'No Admin Accounts' : 'No Search Results'}</h3>
                        <p>${allAdmins.length === 0 ? 'No administrator accounts found.' : 'No admin accounts match your search criteria.'}</p>
                    </div>
                `;
                return;
            }

            adminList.innerHTML = currentAdmins.map(admin => {
                const isLastAdmin = allAdmins.length === 1;
                const deleteButtonDisabled = isLastAdmin ? 'disabled' : '';
                const deleteButtonClass = isLastAdmin ? 'btn btn-secondary' : 'btn btn-danger';
                const deleteButtonTitle = isLastAdmin ? 'Cannot delete the last admin account' : 'Delete admin account';
                
                return `
                <div class="admin-item">
                    <div class="admin-info">
                        <div class="admin-name">${admin.username}</div>
                        <div class="admin-email">${admin.email}</div>
                        <div class="admin-meta">
                            Created: ${new Date(admin.createdAt).toLocaleDateString()}
                            ${admin.createdByUsername ? ` • Created by ${admin.createdByUsername}` : ' • System admin'}
                            ${isLastAdmin ? '<br><span style="color: #dc2626; font-weight: 600; font-size: 0.8rem;">⚠️ Last admin account - cannot be deleted</span>' : ''}
                        </div>
                    </div>
                    <div class="admin-actions">
                        <button class="btn btn-secondary" onclick="updateAdmin('${admin.uid}', '${admin.username}', '${admin.email}')">
                            <i class="fas fa-edit"></i>
                            Update
                        </button>
                        <button class="${deleteButtonClass}" onclick="deleteAdmin('${admin.uid}', '${admin.username}')" 
                                ${deleteButtonDisabled} title="${deleteButtonTitle}">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
            }).join('');
        }

        // Update pagination controls
        function updatePagination() {
            const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);
            const startIndex = (currentPage - 1) * adminsPerPage;
            const endIndex = Math.min(startIndex + adminsPerPage, filteredAdmins.length);
            
            // Update pagination info
            document.getElementById('showingStart').textContent = filteredAdmins.length > 0 ? startIndex + 1 : 0;
            document.getElementById('showingEnd').textContent = endIndex;
            document.getElementById('totalAdmins').textContent = filteredAdmins.length;
            document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
            
            // Update button states
            document.getElementById('prevPage').disabled = currentPage <= 1;
            document.getElementById('nextPage').disabled = currentPage >= totalPages;
            
            // Show/hide pagination
            const pagination = document.getElementById('pagination');
            if (totalPages > 1) {
                pagination.style.display = 'block';
            } else {
                pagination.style.display = 'none';
            }
        }

        // Search functionality
        function searchAdmins(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            
            if (term === '') {
                filteredAdmins = [...allAdmins];
            } else {
                filteredAdmins = allAdmins.filter(admin => 
                    admin.username.toLowerCase().includes(term) ||
                    admin.email.toLowerCase().includes(term) ||
                    (admin.createdByUsername && admin.createdByUsername.toLowerCase().includes(term))
                );
            }
            
            currentPage = 1;
            updateAdminDisplay();
            updatePagination();
        }

        // Update admin
        function updateAdmin(uid, username, email) {
            // Create update modal
            const updateModal = document.createElement('div');
            updateModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            updateModal.innerHTML = `
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                ">
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem; color: #1e293b; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-edit"></i>
                            Update Admin Account
                        </h3>
                        <form id="updateAdminForm">
                            <input type="hidden" id="updateUid" value="${uid}">
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Email Address *</label>
                                <input type="email" id="updateEmail" value="${email}" required 
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Username *</label>
                                <input type="text" id="updateUsername" value="${username}" required 
                                       style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                            </div>
                            <div style="margin-bottom: 1.5rem;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">New Password (optional)</label>
                                <div style="position: relative;">
                                    <input type="password" id="updatePassword" placeholder="Leave blank to keep current password" 
                                           style="width: 100%; padding: 0.75rem; padding-right: 2.5rem; border: 1px solid #d1d5db; border-radius: 8px;">
                                    <button type="button" id="updatePasswordToggle" 
                                            style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); 
                                                   background: none; border: none; color: #6b7280; cursor: pointer; padding: 0.25rem;"
                                            title="Toggle password visibility">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                                <button type="button" id="updateCancelBtn" 
                                        style="padding: 0.75rem 1.5rem; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    Cancel
                                </button>
                                <button type="submit" 
                                        style="padding: 0.75rem 1.5rem; border: none; background: #7c3aed; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    <i class="fas fa-save"></i> Update Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(updateModal);
            
            // Handle cancel button
            document.getElementById('updateCancelBtn').addEventListener('click', function() {
                updateModal.remove();
            });
            
            // Handle password toggle
            document.getElementById('updatePasswordToggle').addEventListener('click', function() {
                const passwordInput = document.getElementById('updatePassword');
                const toggle = this;
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    toggle.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
            
            // Handle form submission
            document.getElementById('updateAdminForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const uid = document.getElementById('updateUid').value;
                const email = document.getElementById('updateEmail').value;
                const username = document.getElementById('updateUsername').value;
                const password = document.getElementById('updatePassword').value;
                
                try {
                    const updateData = { uid, email, username };
                    if (password.trim()) {
                        updateData.password = password;
                    }
                    
                    const response = await App.apiFetch('/updateAdminUser', {
                        method: 'PUT',
                        body: JSON.stringify(updateData)
                    });
                    
                    if (response && response.message) {
                        showSuccess('Admin account updated successfully!');
                        updateModal.remove();
                        loadAdminUsers(); // Refresh the list
                    } else {
                        throw new Error(response?.error || 'Unknown error occurred');
                    }
                } catch (error) {
                    console.error('Error updating admin:', error);
                    showError(error.message || 'Failed to update admin account');
                }
            });
        }

        // Delete admin with custom confirmation
        function deleteAdmin(uid, username) {
            // Create custom confirmation dialog
            const confirmDialog = document.createElement('div');
            confirmDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            confirmDialog.innerHTML = `
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                ">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: #fef2f2;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 1rem;
                        ">
                            <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; color: #dc2626;"></i>
                        </div>
                        <h3 style="margin: 0 0 0.5rem; color: #1e293b; font-size: 1.25rem;">Delete Admin Account</h3>
                        <p style="margin: 0; color: #64748b;">Are you sure you want to permanently delete the admin account for <strong>${username}</strong>?</p>
                        <p style="margin: 0.5rem 0 0; color: #dc2626; font-size: 0.9rem; font-weight: 600;">This action cannot be undone!</p>
                    </div>
                    <div style="display: flex; gap: 0.75rem; justify-content: center;">
                        <button id="deleteCancelBtn" 
                                style="
                                    padding: 0.75rem 1.5rem;
                                    border: 1px solid #d1d5db;
                                    background: white;
                                    color: #374151;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-weight: 600;
                                ">
                            Cancel
                        </button>
                        <button id="deleteConfirmBtn" 
                                style="
                                    padding: 0.75rem 1.5rem;
                                    border: none;
                                    background: #dc2626;
                                    color: white;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-weight: 600;
                                ">
                            <i class="fas fa-trash"></i> Delete Permanently
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(confirmDialog);
            
            // Handle cancel button
            document.getElementById('deleteCancelBtn').addEventListener('click', function() {
                confirmDialog.remove();
            });
            
            // Handle confirm button
            document.getElementById('deleteConfirmBtn').addEventListener('click', async function() {
                try {
                    const response = await App.apiFetch('/deleteAdminUser', {
                        method: 'DELETE',
                        body: JSON.stringify({ uid })
                    });
                    
                    if (response && response.message) {
                        showSuccess(`Admin account for ${username} deleted successfully!`);
                        confirmDialog.remove();
                        loadAdminUsers(); // Refresh the list
                    } else {
                        throw new Error(response?.error || 'Unknown error occurred');
                    }
                } catch (error) {
                    console.error('Error deleting admin:', error);
                    showError(error.message || 'Failed to delete admin account');
                }
            });
        }


        // Create admin account
        async function createAdminAccount(formData) {
            try {
                const response = await App.apiFetch('/createAdminUserSecure', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });

                if (response && response.message) {
                    showSuccess('Admin account created successfully!');
                    document.getElementById('createAdminForm').reset();
                    document.getElementById('passwordStrength').textContent = '';
                    loadAdminUsers(); // Refresh the list
                } else {
                    throw new Error(response?.error || 'Unknown error occurred');
                }
            } catch (error) {
                console.error('Error creating admin account:', error);
                showError(error.message || 'Failed to create admin account');
            }
        }

        // Show success message
        function showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success';
            successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            
            const card = document.querySelector('.card');
            card.insertBefore(successDiv, card.firstChild);
            
            setTimeout(() => {
                successDiv.remove();
            }, 5000);
        }

        // Show error message
        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            
            const card = document.querySelector('.card');
            card.insertBefore(errorDiv, card.firstChild);
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }

        // Form submission
        document.getElementById('createAdminForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validate passwords match
            if (data.password !== data.confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            // Validate username
            if (data.username.length < 3) {
                showError('Username must be at least 3 characters long');
                return;
            }
            
            // Validate password strength
            if (data.password.length < 8) {
                showError('Password must be at least 8 characters long');
                return;
            }
            
            // Remove confirmPassword from data
            delete data.confirmPassword;
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            submitBtn.disabled = true;
            
            try {
                await createAdminAccount(data);
            } finally {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Password strength checking
        document.getElementById('adminPassword').addEventListener('input', function(e) {
            checkPasswordStrength(e.target.value);
        });

        // Pagination functions
        function goToPreviousPage() {
            if (currentPage > 1) {
                currentPage--;
                updateAdminDisplay();
                updatePagination();
            }
        }

        function goToNextPage() {
            const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateAdminDisplay();
                updatePagination();
            }
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            loadUserInfo();
            loadAdminUsers();
            
            // Add search event listener
            document.getElementById('adminSearch').addEventListener('input', function(e) {
                searchAdmins(e.target.value);
            });
            
            // Add pagination event listeners
            document.getElementById('prevPage').addEventListener('click', goToPreviousPage);
            document.getElementById('nextPage').addEventListener('click', goToNextPage);
        });

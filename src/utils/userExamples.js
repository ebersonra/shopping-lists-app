/**
 * Example Usage of Supabase User Functions
 * This file demonstrates how to use the Supabase utilities
 * in different parts of the application
 */

// ============================================================================
// EXAMPLE 1: Login/Authentication Flow
// ============================================================================

async function handleUserLogin(phone) {
    try {
        console.log('🔐 Attempting login with phone:', phone);
        
        // Get user by phone
        const user = await SupabaseUtils.getUserByPhone(phone);
        
        if (user) {
            console.log('✅ User logged in:', user);
            
            // Save to localStorage
            localStorage.setItem('current_user_id', user.id);
            localStorage.setItem('bargainly_user', JSON.stringify({
                user_id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                preferred_market_id: user.preferred_market_id,
                preferred_market_name: user.preferred_market_name
            }));
            
            // Redirect to dashboard
            window.location.href = 'shopping-lists.html';
            return true;
        } else {
            console.log('❌ User not found');
            alert('Usuário não encontrado. Deseja criar uma nova conta?');
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        return false;
    }
}

// ============================================================================
// EXAMPLE 2: Get Current User from localStorage
// ============================================================================

function getCurrentUser() {
    try {
        const userJson = localStorage.getItem('bargainly_user');
        if (!userJson) {
            console.log('⚠️ No user in localStorage');
            return null;
        }
        
        const user = JSON.parse(userJson);
        console.log('✅ Current user:', user);
        return user;
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        return null;
    }
}

// ============================================================================
// EXAMPLE 3: Load User Profile Page
// ============================================================================

async function loadUserProfile() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = 'shopping-welcome.html';
            return;
        }
        
        // Get fresh user data from database
        const user = await SupabaseUtils.getUserById(currentUser.user_id);
        
        if (!user) {
            console.error('❌ User not found in database');
            return;
        }
        
        // Update UI with user data
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userPhone').textContent = user.phone || 'Não informado';
        document.getElementById('userEmail').textContent = user.email || 'Não informado';
        document.getElementById('preferredMarket').textContent = user.preferred_market_name || 'Nenhum';
        
        // Get user statistics
        const stats = await SupabaseUtils.getUserStatistics(user.id);
        
        if (stats) {
            document.getElementById('totalLists').textContent = stats.total_lists || 0;
            document.getElementById('completedLists').textContent = stats.completed_lists || 0;
            document.getElementById('activeLists').textContent = stats.active_lists || 0;
            document.getElementById('totalItems').textContent = stats.total_items || 0;
            document.getElementById('totalSpent').textContent = 
                `R$ ${(stats.total_spent || 0).toFixed(2)}`;
            document.getElementById('favoriteMarket').textContent = 
                stats.favorite_market || 'Nenhum';
            document.getElementById('favoriteCategory').textContent = 
                stats.favorite_category || 'Nenhuma';
        }
        
        console.log('✅ User profile loaded');
    } catch (error) {
        console.error('❌ Error loading user profile:', error);
    }
}

// ============================================================================
// EXAMPLE 4: Update User Profile
// ============================================================================

async function updateUserProfile(formData) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Você precisa estar logado para atualizar o perfil');
            return false;
        }
        
        console.log('📝 Updating user profile...');
        
        // Update user in database
        const updatedUser = await SupabaseUtils.updateUser(currentUser.user_id, {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            preferred_market_id: formData.preferred_market_id
        });
        
        if (!updatedUser) {
            throw new Error('Failed to update user');
        }
        
        // Update localStorage
        const userToSave = {
            ...currentUser,
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
            preferred_market_id: updatedUser.preferred_market_id
        };
        localStorage.setItem('bargainly_user', JSON.stringify(userToSave));
        
        console.log('✅ User profile updated');
        alert('Perfil atualizado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Error updating user profile:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
        return false;
    }
}

// ============================================================================
// EXAMPLE 5: Create Shopping List (with user reference)
// ============================================================================

async function createShoppingList(listData) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('Você precisa estar logado para criar uma lista');
            return null;
        }
        
        console.log('📋 Creating shopping list...');
        
        // Get Supabase client
        const client = SupabaseUtils.getSupabaseClient();
        
        // Create list using RPC function
        const { data, error } = await client.rpc('create_shopping_list', {
            p_user_id: currentUser.user_id,
            p_title: listData.title,
            p_description: listData.description || null,
            p_shopping_date: listData.shopping_date || new Date().toISOString().split('T')[0],
            p_market_id: listData.market_id || currentUser.preferred_market_id || null
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Shopping list created:', data);
        return data;
    } catch (error) {
        console.error('❌ Error creating shopping list:', error);
        alert('Erro ao criar lista. Tente novamente.');
        return null;
    }
}

// ============================================================================
// EXAMPLE 6: Check if User is Logged In (Guard)
// ============================================================================

function requireLogin() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        console.log('⚠️ User not logged in, redirecting to welcome page');
        window.location.href = 'shopping-welcome.html';
        return false;
    }
    
    console.log('✅ User is logged in:', currentUser.name);
    return true;
}

// ============================================================================
// EXAMPLE 7: Logout
// ============================================================================

function logout() {
    try {
        // Clear localStorage
        localStorage.removeItem('bargainly_user');
        localStorage.removeItem('current_user_id');
        
        console.log('👋 User logged out');
        
        // Redirect to welcome page
        window.location.href = 'shopping-welcome.html';
    } catch (error) {
        console.error('❌ Error during logout:', error);
    }
}

// ============================================================================
// EXAMPLE 8: Display User Info in Header
// ============================================================================

async function updateHeaderWithUserInfo() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        // Simple display
        const userNameEl = document.getElementById('headerUserName');
        if (userNameEl) {
            userNameEl.textContent = currentUser.name;
        }
        
        // Get avatar initials
        const initials = currentUser.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
            avatarEl.textContent = initials;
        }
        
        // Get fresh statistics
        const stats = await SupabaseUtils.getUserStatistics(currentUser.user_id);
        if (stats) {
            const statsEl = document.getElementById('userStats');
            if (statsEl) {
                statsEl.innerHTML = `
                    <span>${stats.active_lists} listas ativas</span>
                    <span>R$ ${(stats.total_spent || 0).toFixed(2)} gastos</span>
                `;
            }
        }
    } catch (error) {
        console.error('❌ Error updating header:', error);
    }
}

// ============================================================================
// EXAMPLE 9: Search Users (Admin function)
// ============================================================================

async function searchUsers(searchTerm) {
    try {
        const client = SupabaseUtils.getSupabaseClient();
        
        const { data, error } = await client
            .from('users')
            .select('id, name, phone, email, created_at')
            .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .is('deleted_at', null)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {
            throw error;
        }
        
        console.log('🔍 Search results:', data);
        return data;
    } catch (error) {
        console.error('❌ Error searching users:', error);
        return [];
    }
}

// ============================================================================
// EXAMPLE 10: Initialize App with User Check
// ============================================================================

async function initializeApp() {
    try {
        console.log('🚀 Initializing app...');
        
        // Initialize Supabase
        SupabaseUtils.initSupabase();
        
        // Check if user is logged in
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            console.log('⚠️ No user logged in');
            // Redirect to welcome page if not on it already
            if (!window.location.pathname.includes('shopping-welcome.html')) {
                window.location.href = 'shopping-welcome.html';
            }
            return;
        }
        
        console.log('✅ User logged in:', currentUser.name);
        
        // Update header with user info
        await updateHeaderWithUserInfo();
        
        // Load user-specific data
        // (implement based on the page)
        
        console.log('✅ App initialized');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
}

// ============================================================================
// EXAMPLE 11: HTML Integration
// ============================================================================

/*
<!-- Add to your HTML pages -->

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Shopping Lists</title>
    
    <!-- Supabase JS Client -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <header>
        <div id="userAvatar"></div>
        <span id="headerUserName"></span>
        <div id="userStats"></div>
        <button onclick="logout()">Sair</button>
    </header>
    
    <main>
        <!-- Your content here -->
    </main>
    
    <!-- Supabase Utilities -->
    <script src="../utils/supabaseClient.js"></script>
    
    <!-- This example file (for reference) -->
    <script src="../utils/userExamples.js"></script>
    
    <script>
        // Initialize app on page load
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });
    </script>
</body>
</html>
*/

// ============================================================================
// Export functions for use in other files
// ============================================================================

if (typeof window !== 'undefined') {
    window.UserExamples = {
        handleUserLogin,
        getCurrentUser,
        loadUserProfile,
        updateUserProfile,
        createShoppingList,
        requireLogin,
        logout,
        updateHeaderWithUserInfo,
        searchUsers,
        initializeApp
    };
}

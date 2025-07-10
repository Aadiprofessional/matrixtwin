interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

let currentUser: User | null = null;

export const setUserInfo = (user: User) => {
  currentUser = user;
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserInfo = (): User | null => {
  if (currentUser) return currentUser;
  
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    return currentUser;
  }
  
  return null;
};

export const clearUserInfo = () => {
  currentUser = null;
  localStorage.removeItem('user');
};

export const updateUserRole = async () => {
  try {
    const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/users/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      const user = getUserInfo();
      if (user) {
        user.role = userData.role;
        setUserInfo(user);
      }
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

export const isAdmin = () => getUserInfo()?.role === 'admin';
export const isContractor = () => getUserInfo()?.role === 'contractor';
export const isProjectManager = () => getUserInfo()?.role === 'project_manager';
export const isWorker = () => getUserInfo()?.role === 'worker';
export const isClient = () => getUserInfo()?.role === 'client'; 
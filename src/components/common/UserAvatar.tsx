import React from 'react';

interface UserAvatarProps {
  name: string;
  image?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  image, 
  size = 'md',
  className = ''
}) => {
  // Get initials from name
  const getInitials = (name: string): string => {
    if (!name) return '';
    
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0) return '';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Generate a consistent color based on name
  const getAvatarColor = (name: string): string => {
    if (!name) return 'bg-primary-500';
    
    const colors = [
      'bg-primary-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-error-500',
      'bg-purple-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    
    // Simple hash function to pick a consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        flex items-center justify-center 
        rounded-full 
        ${image ? '' : getAvatarColor(name)} 
        ${image ? '' : 'text-white font-medium'}
        ${className}
      `}
    >
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default UserAvatar; 
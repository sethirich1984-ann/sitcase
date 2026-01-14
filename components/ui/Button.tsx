import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  // 基础样式: 圆角更大，过渡更平滑，点击有缩放
  const baseStyles = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.96] select-none";
  
  const variants = {
    // 主按钮: 品牌渐变感，光晕阴影
    primary: "bg-brand-500 text-white hover:bg-brand-400 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_20px_-3px_rgba(16,185,129,0.6)] border border-transparent",
    
    // 次级按钮: 深色背景，浅色文字
    secondary: "bg-dark-800 text-slate-200 hover:bg-dark-700 border border-dark-700 shadow-sm",
    
    // 描边按钮
    outline: "bg-transparent border border-dark-700 text-slate-300 hover:border-brand-500 hover:text-brand-400",
    
    // 幽灵按钮
    ghost: "text-slate-400 hover:text-slate-700 hover:bg-slate-100/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
export default function Card({ children, className = '', padding = true, shadow = true }) {
  const baseClasses = 'bg-white rounded-lg';
  const paddingClass = padding ? 'p-6' : '';
  const shadowClass = shadow ? 'shadow' : '';
  
  return (
    <div className={`${baseClasses} ${paddingClass} ${shadowClass} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex justify-between items-center mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function InfoCard({ icon, title, message, type = 'info', className = '' }) {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-500 text-blue-800',
    success: 'bg-green-50 border-green-500 text-green-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    error: 'bg-red-50 border-red-500 text-red-800',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${typeClasses[type]} ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="text-xl">{icon}</div>}
        <div className="flex-1">
          {title && <p className="font-semibold">{title}</p>}
          <p className={!title ? 'font-medium' : ''}>{message}</p>
        </div>
      </div>
    </div>
  );
}

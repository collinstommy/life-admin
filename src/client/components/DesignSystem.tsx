import React from 'react';

// Icon components
const HealthIcon = ({ icon, className = "" }: { icon: string; className?: string }) => (
  <span className={`text-lg ${className}`}>{icon}</span>
);

// Button components
const DesignSystemButton = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick,
  disabled = false 
}: {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    accent: "btn-accent",
    ghost: "btn-ghost",
    outline: "btn-outline"
  };
  const sizeClasses = {
    xs: "btn-xs",
    sm: "btn-sm", 
    md: "btn-md",
    lg: "btn-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} rounded-xl`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Card components
const GlassCard = ({ 
  children, 
  className = "", 
  title,
  subtitle 
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) => (
  <div className={`glass-card rounded-2xl p-6 ${className}`}>
    {title && (
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

// Badge components
const HealthBadge = ({ 
  color = 'primary', 
  icon, 
  text,
  variant = 'solid'
}: {
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  icon?: string;
  text: string;
  variant?: 'solid' | 'outline';
}) => {
  const colorClasses = {
    primary: "bg-primary text-primary-content",
    secondary: "bg-secondary text-secondary-content",
    accent: "bg-accent text-accent-content",
    success: "bg-success text-success-content",
    warning: "bg-warning text-warning-content",
    error: "bg-error text-error-content"
  };
  
  const outlineClasses = {
    primary: "text-primary border border-primary",
    secondary: "text-secondary border border-secondary",
    accent: "text-accent border border-accent",
    success: "text-success border border-success",
    warning: "text-warning border border-warning",
    error: "text-error border border-error"
  };
  
  const classes = variant === 'outline' 
    ? outlineClasses[color] 
    : colorClasses[color];
  
  return (
    <div className={`badge ${classes} px-3 py-1.5`}>
      {icon && <HealthIcon icon={icon} className="mr-1" />}
      {text}
    </div>
  );
};

// Metric components
const MetricCard = ({ 
  value, 
  label, 
  icon, 
  color = 'primary',
  unit = ''
}: {
  value: string | number;
  label: string;
  icon: string;
  color?: 'energy' | 'mood' | 'sleep' | 'weight' | 'workout' | 'meal';
  unit?: string;
}) => {
  const colorClasses = {
    energy: "energy-gradient text-white",
    mood: "mood-gradient text-white", 
    sleep: "sleep-gradient text-white",
    weight: "weight-gradient text-white",
    workout: "workout-gradient text-white",
    meal: "meal-gradient text-white"
  };
  
  return (
    <div className={`metric-card rounded-2xl p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-3xl font-bold">
            {value}
            {unit && <span className="text-xl">{unit}</span>}
          </p>
        </div>
        <HealthIcon icon={icon} className="text-3xl" />
      </div>
    </div>
  );
};

// Progress components
const ProgressBar = ({ 
  value, 
  max = 10, 
  color = 'primary',
  label
}: {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}) => (
  <div className="w-full">
    {label && <p className="text-sm text-slate-600 mb-1">{label}</p>}
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div 
        className={`bg-${color}-500 rounded-full h-2 transition-all duration-300`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

// Form components
const HealthInput = ({ 
  type = 'text', 
  placeholder, 
  value,
  onChange,
  label,
  icon
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  icon?: string;
}) => (
  <div className="form-control">
    {label && (
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <HealthIcon icon={icon} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input input-bordered w-full rounded-xl ${icon ? 'pl-10' : ''}`}
      />
    </div>
  </div>
);

// Navigation components
const HealthNav = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="navbar glass-card rounded-b-2xl mb-6">
    <div className="navbar-start">
      <button className="btn btn-ghost btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
    </div>
    <div className="navbar-center">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    <div className="navbar-end">
      <button className="btn btn-ghost btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      </button>
    </div>
  </div>
);

// Design System Showcase Component
const DesignSystem = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Health App Design System</h1>
          <p className="text-lg text-slate-600">Component library and design tokens for consistent UI</p>
        </div>

        {/* Color Palette */}
        <section className="mb-12">
          <GlassCard title="Color Palette" subtitle="Consistent colors across the app">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-slate-500">#667eea</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-slate-500">#8b5cf6</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-slate-500">#14b8a6</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-success rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-xs text-slate-500">#10b981</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-warning rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Warning</p>
                <p className="text-xs text-slate-500">#f59e0b</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-error rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Error</p>
                <p className="text-xs text-slate-500">#ef4444</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <GlassCard title="Buttons" subtitle="Interactive elements">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <DesignSystemButton variant="primary">Primary Button</DesignSystemButton>
                <DesignSystemButton variant="secondary">Secondary Button</DesignSystemButton>
                <DesignSystemButton variant="accent">Accent Button</DesignSystemButton>
                <DesignSystemButton variant="ghost">Ghost Button</DesignSystemButton>
                <DesignSystemButton variant="outline">Outline Button</DesignSystemButton>
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <DesignSystemButton size="xs">Extra Small</DesignSystemButton>
                <DesignSystemButton size="sm">Small</DesignSystemButton>
                <DesignSystemButton size="md">Medium</DesignSystemButton>
                <DesignSystemButton size="lg">Large</DesignSystemButton>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <GlassCard title="Cards" subtitle="Content containers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard title="Glass Card" subtitle="With subtitle">
                <p className="text-slate-600">This is a glassmorphism card with backdrop blur and subtle shadows.</p>
              </GlassCard>
              <GlassCard>
                <h4 className="font-semibold text-slate-900 mb-2">Metric Card</h4>
                <p className="text-slate-600 mb-4">Display health metrics and data.</p>
                <div className="space-y-2">
                  <MetricCard value={8.5} label="Energy" icon="⚡" color="energy" />
                  <MetricCard value={9} label="Mood" icon="😊" color="mood" />
                </div>
              </GlassCard>
            </div>
          </GlassCard>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <GlassCard title="Badges" subtitle="Status indicators">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <HealthBadge color="primary" text="Primary" />
                <HealthBadge color="secondary" text="Secondary" />
                <HealthBadge color="accent" text="Accent" />
                <HealthBadge color="success" text="Success" />
                <HealthBadge color="warning" text="Warning" />
                <HealthBadge color="error" text="Error" />
              </div>
              <div className="flex flex-wrap gap-2">
                <HealthBadge color="primary" icon="⚡" text="Energy 8/10" />
                <HealthBadge color="mood" icon="😊" text="Mood 9/10" />
                <HealthBadge color="sleep" icon="😴" text="8h Sleep" />
                <HealthBadge color="workout" icon="🏋️" text="45min" />
                <HealthBadge color="meal" icon="🍽️" text="3 Meals" />
              </div>
              <div className="flex flex-wrap gap-2">
                <HealthBadge color="success" text="Outline" variant="outline" />
                <HealthBadge color="warning" text="Warning" variant="outline" />
                <HealthBadge color="error" text="Error" variant="outline" />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Form Elements */}
        <section className="mb-12">
          <GlassCard title="Form Elements" subtitle="Input components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HealthInput 
                label="Text Input"
                placeholder="Enter your health note..."
                icon="📝"
              />
              <HealthInput 
                label="Number Input"
                type="number"
                placeholder="Enter energy level (1-10)"
                icon="⚡"
              />
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-slate-900 mb-3">Progress Bars</h4>
              <div className="space-y-3">
                <ProgressBar value={8} max={10} color="energy" label="Energy Level" />
                <ProgressBar value={9} max={10} color="mood" label="Mood Score" />
                <ProgressBar value={7.5} max={10} color="sleep" label="Sleep Quality" />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Navigation */}
        <section className="mb-12">
          <GlassCard title="Navigation" subtitle="Header and navigation components">
            <HealthNav title="Health Entry" subtitle="Monday, August 3, 2025" />
          </GlassCard>
        </section>

        {/* Usage Guidelines */}
        <section>
          <GlassCard title="Usage Guidelines" subtitle="How to use these components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">For Developers</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Import components from DesignSystem.tsx</li>
                  <li>• Use consistent color tokens from the palette</li>
                  <li>• Follow spacing scale (4px base unit)</li>
                  <li>• Use glass-card class for elevated surfaces</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">For Designers</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Use Inter font family exclusively</li>
                  <li>• Maintain 8px grid system</li>
                  <li>• Apply glassmorphism effects sparingly</li>
                  <li>• Use semantic color names for consistency</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </section>

      </div>
    </div>
  );
};

export default DesignSystem;
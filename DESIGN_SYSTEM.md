# Health App Design System

Welcome to our comprehensive design system for the Health Tracker application. This system provides consistent, reusable components for building professional health tracking interfaces.

## 🎯 Quick Start

### For Developers
```typescript
// Import design system components
import { DesignSystem } from './src/client/components/DesignSystem'

// Use individual components
import { GlassCard, HealthBadge, MetricCard } from './src/client/components/DesignSystem'
```

### For Designers
- **Font**: Inter (Google Fonts)
- **Grid System**: 8px base unit
- **Border Radius**: 0.5rem (8px) for buttons, 1rem (16px) for cards
- **Shadows**: Glassmorphism effects with backdrop blur

## 🎨 Design Tokens

### Color Palette

| Token | CSS Variable | Hex Value | Usage |
|-------|--------------|-----------|--------|
| **Primary** | `--color-primary` | `#667eea` | Main actions, primary buttons |
| **Secondary** | `--color-secondary` | `#8b5cf6` | Secondary actions, highlights |
| **Accent** | `--color-accent` | `#14b8a6` | Success states, positive feedback |
| **Neutral** | `--color-neutral` | `#1e293b` | Text, borders |
| **Base-100** | `--color-base-100` | `#ffffff` | Background |
| **Base-200** | `--color-base-200` | `#f8fafc` | Secondary background |

### Health-Specific Colors

| Category | Class | Gradient | Usage |
|----------|-------|----------|--------|
| **Energy** | `.energy-gradient` | Green | Energy levels, activity |
| **Mood** | `.mood-gradient` | Orange | Mood tracking |
| **Sleep** | `.sleep-gradient` | Purple | Sleep metrics |
| **Weight** | `.weight-gradient` | Blue | Weight tracking |
| **Workout** | `.workout-gradient` | Red | Exercise data |
| **Meal** | `.meal-gradient` | Teal | Nutrition tracking |

## 🧩 Component Library

### Cards

#### GlassCard
```typescript
// Basic usage
<GlassCard>
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>

// With title and subtitle
<GlassCard title="Health Summary" subtitle="Today's overview">
  <p>Content here</p>
</GlassCard>
```

**CSS Classes**: `.glass-card`, `.metric-card`

### Buttons

#### DesignSystemButton
```typescript
// Variants
<DesignSystemButton variant="primary">Primary</DesignSystemButton>
<DesignSystemButton variant="secondary">Secondary</DesignSystemButton>
<DesignSystemButton variant="accent">Accent</DesignSystemButton>
<DesignSystemButton variant="ghost">Ghost</DesignSystemButton>
<DesignSystemButton variant="outline">Outline</DesignSystemButton>

// Sizes
<DesignSystemButton size="xs">Extra Small</DesignSystemButton>
<DesignSystemButton size="sm">Small</DesignSystemButton>
<DesignSystemButton size="md">Medium</DesignSystemButton>
<DesignSystemButton size="lg">Large</DesignSystemButton>
```

**DaisyUI Classes**: `.btn`, `.btn-primary`, `.btn-sm`, etc.

### Badges

#### HealthBadge
```typescript
// Solid badges
<HealthBadge color="primary" text="Active" />
<HealthBadge color="success" text="Completed" />

// With icons
<HealthBadge color="energy" icon="⚡" text="Energy 8/10" />

// Outline variant
<HealthBadge color="warning" text="Pending" variant="outline" />
```

**DaisyUI Classes**: `.badge`, `.badge-primary`, `.badge-outline`

### Metrics

#### MetricCard
```typescript
<MetricCard 
  value={8.5} 
  label="Energy Level" 
  icon="⚡" 
  color="energy" 
  unit="/10" 
/>
```

### Form Elements

#### HealthInput
```typescript
<HealthInput 
  label="Energy Level"
  type="number"
  placeholder="Enter energy level (1-10)"
  icon="⚡"
/>
```

#### ProgressBar
```typescript
<ProgressBar 
  value={8} 
  max={10} 
  color="energy" 
  label="Energy Level" 
/>
```

### Icons

Use emoji icons for consistency:
- ⚡ Energy
- 😊 Mood
- 😴 Sleep
- ⚖️ Weight
- 🏋️ Workout
- 🍽️ Meal
- 📝 Notes
- 🎤 Voice
- 📊 Data

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: ≥ 1024px

### Responsive Classes
```css
/* Mobile adjustments */
@media (max-width: 768px) {
  .glass-card {
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
```

## 🎭 Glassmorphism Guidelines

### When to Use
- **Cards**: Elevated content containers
- **Modals**: Dialog boxes and overlays
- **Navigation**: Header bars and sidebars
- **Tooltips**: Contextual information

### Implementation
```css
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

## 🧱 Layout System

### Grid
- **Base unit**: 8px
- **Spacing scale**: 0.5rem, 1rem, 1.5rem, 2rem, etc.
- **Container max-width**: 7xl (1280px)

### Spacing Examples
```typescript
// Consistent spacing
div className="p-4" // 16px
div className="space-y-4" // 16px between items
div className="gap-4" // 16px grid gap
```

## 🛠️ Development Guidelines

### Component Usage
1. **Always use semantic color names** (primary, secondary, accent)
2. **Use consistent spacing** (8px grid system)
3. **Apply glassmorphism effects sparingly** (max 2-3 per screen)
4. **Maintain focus states** for accessibility
5. **Use Inter font family exclusively**

### File Structure
```
src/
├── client/
│   ├── components/
│   │   ├── DesignSystem.tsx     # Main design system
│   │   ├── HealthTrackerApp.tsx # App wrapper
│   │   └── [other components]
│   ├── pages/
│   │   └── DebugPage.tsx        # Design system showcase
│   └── styles.css               # Global styles
```

### Testing Design System
Access the design system at: `/debug` route when running the application.

## 🔄 Updates and Maintenance

### Adding New Components
1. Add component to `DesignSystem.tsx`
2. Include usage examples in DebugPage
3. Update this documentation
4. Ensure consistent styling with existing components

### Color Updates
Update colors in `tailwind.config.js` under `colors` section:

```javascript
health: {
  50: '#f8fafc',
  100: '#f1f5f9',
  // ... etc
}
```

## 📋 Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG 2.1 standards
- [ ] Keyboard navigation support
- [ ] Screen reader friendly labels
- [ ] Responsive design for all screen sizes
- [ ] Reduced motion preferences respected

## 🚀 Quick Access

### Design System Page
Visit `/debug` in your application to see all components in action.

### Component Preview
The debug page includes:
- **Color palette** with hex values
- **All button variants** and sizes
- **Card examples** with different content
- **Badge styles** with icons and colors
- **Form components** with examples
- **Usage guidelines** for developers and designers

---

*Last updated: August 2025*
*For questions or updates, please open an issue or contact the design team.*
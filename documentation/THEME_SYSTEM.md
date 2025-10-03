# Theme System Documentation

## Overview

BioQuery now has a complete light/dark theme system following modern design principles inspired by Vercel, Linear, and Notion.

## Features

✅ Light and Dark themes
✅ Theme toggle button in navbar
✅ Smooth transitions between themes
✅ Persistent theme preference (localStorage)
✅ System preference detection
✅ CSS custom properties for theme values
✅ Full Tailwind integration

## How It Works

### Theme Context

The theme is managed by `ThemeContext` which:
- Stores current theme state ('light' or 'dark')
- Persists to localStorage as 'bioquery-theme'
- Detects system preference on first load
- Provides `toggleTheme()` function

### Using the Theme

```tsx
import { useTheme } from '@/hooks/use-theme';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Theme Toggle Component

Located in `src/components/ThemeToggle.tsx`
- Animated sun/moon icons
- Smooth rotation transitions
- Already integrated in navbar

## Color System

### CSS Variables

All theme colors are defined as CSS custom properties in `src/index.css`:

```css
:root {
  /* Light theme (default) */
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-text: #0f172a;
  /* ... etc */
}

.dark {
  /* Dark theme overrides */
  --color-background: #020617;
  --color-surface: #0b1120;
  --color-text: #f3f4f6;
  /* ... etc */
}
```

### Using Theme Colors

#### In Tailwind Classes
```tsx
<div className="bg-scheme-background text-scheme-text">
  Theme-aware content
</div>
```

#### Available Scheme Utilities
- `bg-scheme-background` - Main background
- `bg-scheme-surface` - Card/surface background
- `bg-scheme-surface-hover` - Hover state
- `border-scheme-border` - Border color
- `border-scheme-border-subtle` - Lighter borders
- `text-scheme-text` - Primary text
- `text-scheme-muted` - Secondary text
- `text-scheme-subtle` - Tertiary text

### Static Colors

These remain the same in both themes:

```tsx
// Biosphere (primary accent) - Bio-inspired green
bg-biosphere-500  // #00e7b3
bg-biosphere-600  // #00c795

// Cosmic (secondary accent) - Purple
bg-cosmic-500     // #8b5cf6
bg-cosmic-600     // #7c3aed

// Space (neutral grays)
bg-space-900      // #020617 (darkest)
bg-space-100      // #f3f4f6 (lightest)
```

## Transitions

Add smooth theme transitions with:

```tsx
<div className="transition-theme">
  Content with smooth color transitions
</div>
```

This applies:
- background-color transition: 0.3s
- border-color transition: 0.3s
- color transition: 0.3s

## Best Practices

### 1. Always Use Scheme Colors for Theme-Aware Elements

❌ Bad:
```tsx
<div className="bg-white text-gray-900">
```

✅ Good:
```tsx
<div className="bg-scheme-background text-scheme-text">
```

### 2. Use Static Colors for Accents

```tsx
<button className="bg-biosphere-500 hover:bg-biosphere-600">
  Primary Action
</button>
```

### 3. Add Transitions

```tsx
<div className="border-scheme-border transition-theme">
  Smooth theme changes
</div>
```

### 4. Test in Both Themes

Always check your components in both light and dark modes:
- Toggle theme button in navbar
- Check contrast ratios
- Verify border visibility
- Test hover states

## Component Examples

### Card with Theme Support

```tsx
<Card className="bg-scheme-surface border-scheme-border transition-theme">
  <div className="p-6">
    <h3 className="text-scheme-text">Heading</h3>
    <p className="text-scheme-muted">Description text</p>
  </div>
</Card>
```

### Button Variants

```tsx
// Primary (always biosphere green)
<Button variant="default">Action</Button>

// Secondary (theme-aware)
<Button variant="secondary">Cancel</Button>

// Outline (theme-aware)
<Button variant="outline">More</Button>

// Ghost (theme-aware)
<Button variant="ghost">Subtle</Button>

// Link (accent color)
<Button variant="link">Learn More</Button>
```

## Extending the Theme

### Adding New Colors

1. Add to `tailwind.config.cjs`:
```js
extend: {
  colors: {
    myColor: {
      500: '#hexcode',
    }
  }
}
```

2. Add CSS variables if theme-aware:
```css
:root {
  --color-my-color: #lightValue;
}

.dark {
  --color-my-color: #darkValue;
}
```

3. Add Tailwind utility:
```css
.bg-my-color {
  background-color: var(--color-my-color);
}
```

## Troubleshooting

### Theme Not Persisting
Check localStorage in DevTools → Application → Local Storage
- Key: `bioquery-theme`
- Value: `'light'` or `'dark'`

### Colors Not Changing
1. Verify `.dark` class is on `<html>` element
2. Check CSS variables are defined
3. Ensure you're using `scheme-` utilities

### Flash of Wrong Theme
Add this to `index.html` `<head>`:
```html
<script>
  const theme = localStorage.getItem('bioquery-theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.add(theme);
</script>
```

## Design Tokens Reference

### Light Theme
```
Background:   #ffffff (pure white)
Surface:      #f9fafb (off-white)
Text:         #0f172a (near-black)
Muted:        #475569 (gray)
Border:       rgba(15,23,42,0.12) (subtle)
```

### Dark Theme
```
Background:   #020617 (space navy)
Surface:      #0b1120 (dark blue)
Text:         #f3f4f6 (off-white)
Muted:        #cbd5e1 (light gray)
Border:       rgba(148,163,184,0.24) (subtle)
```

### Accents (Both Themes)
```
Primary:      #00e7b3 (biosphere green)
Secondary:    #8b5cf6 (cosmic purple)
```

## Accessibility

- All color combinations meet WCAG AA contrast requirements
- Theme toggle has proper aria-label
- Focus states are visible in both themes
- Reduced motion respected for animations

---

**Created:** Sprint 0  
**Last Updated:** Theme implementation  
**Status:** ✅ Production Ready

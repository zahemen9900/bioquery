# Component Theming Guide

## Overview
All new dashboard components follow BioQuery's dynamic theme system using CSS variables for seamless light/dark mode switching.

## Color Token Reference

### Background Layers
```css
--color-background     /* Page background */
--color-surface        /* Card/panel background */
--color-surface-hover  /* Hover state for interactive surfaces */
```

### Borders
```css
--color-border         /* Primary borders (24% opacity) */
--color-border-subtle  /* Subtle dividers (12% opacity) */
```

### Text
```css
--color-text           /* Primary text (headings, body) */
--color-text-muted     /* Secondary text (descriptions) */
--color-text-subtle    /* Tertiary text (metadata, timestamps) */
```

### Accents
```css
--color-accent         /* biosphere-500 (#00e7b3) */
--color-accent-hover   /* biosphere-600 (#00c795) */
```

## Tailwind Utility Classes

### Backgrounds
- `bg-scheme-background` - Page/app background
- `bg-scheme-surface` - Cards, modals, sidebar
- `bg-scheme-muted` - Hover states, muted sections

### Borders
- `border-scheme-border` - Standard borders
- `border-scheme-border-subtle` - Subtle dividers

### Text
- `text-scheme-text` - Primary text
- `text-scheme-muted-text` - Secondary text
- `text-scheme-subtle` - Metadata text

## Component Patterns

### Card
```tsx
<Card className="bg-scheme-surface border-scheme-border">
  <h3 className="text-scheme-text">Title</h3>
  <p className="text-scheme-muted-text">Description</p>
</Card>
```

### Input
```tsx
<Input 
  className="bg-scheme-surface border-scheme-border text-scheme-text"
  placeholder="Type here..."
/>
```

### Button
```tsx
<Button className="bg-biosphere-500 hover:bg-biosphere-600 text-white">
  Action
</Button>
```

### Badge
```tsx
<Badge variant="secondary" className="bg-scheme-muted text-scheme-text">
  Label
</Badge>
```

## ShadCN Component Customization

### Avatar
- Fallback background: `bg-biosphere-500`
- Fallback text: `text-white font-medium`

### Dialog/Sheet Overlay
- Background: `bg-black/60 backdrop-blur-sm`
- Smooth fade transitions

### Dialog/Sheet Content
- Background: `bg-scheme-surface`
- Border: `border-scheme-border`
- Shadow: `shadow-2xl`

### Popover
- Background: `bg-scheme-surface`
- Border: `border-scheme-border rounded-xl`
- Width: `w-72` default

### ScrollBar
- Track: `border-scheme-border`
- Thumb: `bg-scheme-border hover:bg-scheme-muted`

### Accordion
- Trigger hover: `hover:text-biosphere-500`
- Chevron animation: `rotate-180` on open

## Animation Guidelines

### Durations
- Fast (hover): `200ms`
- Standard (transitions): `300ms`
- Slow (page changes): `500ms`

### Easing
- Default: `ease-out`
- Bouncy (scale): `ease-in-out`

### Framer Motion Presets
```tsx
// Fade in from below
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Scale and fade
initial={{ scale: 0.5, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ duration: 0.5 }}

// Stagger children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  }}
>
  {items.map(item => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    />
  ))}
</motion.div>
```

## Gradient Patterns

### Type-Specific Icons
```tsx
// Notes
className="bg-gradient-to-br from-blue-500 to-cyan-500"

// Knowledge Graphs
className="bg-gradient-to-br from-purple-500 to-pink-500"

// Visualizations
className="bg-gradient-to-br from-green-500 to-emerald-500"
```

### Brand Gradient
```tsx
className="bg-gradient-to-br from-biosphere-500 to-cosmic-500"
```

### Text Gradient
```tsx
className="bg-gradient-to-r from-biosphere-500 to-cosmic-500 bg-clip-text text-transparent"
```

## Responsive Breakpoints

```tsx
// Mobile first
className="px-4 md:px-6 lg:px-8"

// Grid columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Hidden/visible
className="hidden md:flex"
className="md:hidden"
```

## Focus States

### Inputs
```tsx
focus:border-biosphere-500 
focus:ring-2 
focus:ring-biosphere-500/40
```

### Buttons
```tsx
focus:outline-none 
focus:ring-2 
focus:ring-biosphere-500 
focus:ring-offset-2
```

### Interactive Cards
```tsx
hover:border-biosphere-500 
hover:shadow-xl 
transition-all
```

## Dark Mode Overrides

When light theme isn't sufficient, use `dark:` prefix:

```tsx
className="bg-white dark:bg-space-900"
className="text-gray-900 dark:text-gray-100"
className="border-gray-200 dark:border-gray-800"
```

## Accessibility

### Required Patterns
- `sr-only` for icon-only buttons
- `aria-label` for non-text elements
- Semantic HTML (`<nav>`, `<main>`, `<aside>`)
- Keyboard navigation (`tabIndex`, `onKeyDown`)

### Example
```tsx
<button aria-label="Close dialog">
  <HiXMark className="h-5 w-5" />
  <span className="sr-only">Close</span>
</button>
```

## Performance Tips

1. **Use CSS transforms** over position changes
2. **Prefer opacity** over display/visibility for animations
3. **Limit backdrop-blur** to modals/sheets only
4. **Use `will-change`** sparingly for animations
5. **Memoize expensive** gradient calculations

## Testing Theme Consistency

```bash
# Check all scheme variables are used correctly
grep -r "bg-gray-" src/  # Should return nothing
grep -r "text-gray-" src/  # Should return nothing
grep -r "border-gray-" src/  # Should return nothing

# Verify scheme classes exist
grep -r "bg-scheme-" src/
grep -r "text-scheme-" src/
grep -r "border-scheme-" src/
```

## Common Mistakes to Avoid

❌ **Don't use hardcoded colors**
```tsx
className="bg-gray-100 text-gray-900"
```

✅ **Use theme variables**
```tsx
className="bg-scheme-surface text-scheme-text"
```

❌ **Don't mix light/dark conditionals**
```tsx
{theme === 'dark' ? 'bg-black' : 'bg-white'}
```

✅ **Use CSS variables**
```tsx
className="bg-scheme-background"
```

❌ **Don't skip transitions**
```tsx
className="bg-scheme-surface"
```

✅ **Add smooth transitions**
```tsx
className="bg-scheme-surface transition-colors duration-300"
```

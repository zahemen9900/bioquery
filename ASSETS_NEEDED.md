# BioQuery Home Page - Missing Elements Guide

## Overview
The home page has been enhanced with a modern, premium design system featuring:
- ✅ Light/Dark theme toggle (working in navbar)
- ✅ Smooth animations with Framer Motion
- ✅ Glassmorphism and gradient effects
- ✅ Responsive layout with Tailwind CSS
- ✅ Theme-aware color system

## Elements You Need to Add/Replace

### 1. **Logo/Brand Identity**
**Location:** Navbar (`NavbarHome.tsx`)
**Current:** Placeholder image URL
```tsx
<img
  src="https://d22po4pjz3o32e.cloudfront.net/logo-image.svg"
  alt="Logo image"
/>
```
**What to add:**
- Your BioQuery logo (SVG preferred for crisp scaling)
- Should work in both light and dark themes
- Recommended size: 32-40px height
- Consider adding brand name text next to logo

---

### 2. **Hero Animation/Illustration**
**Location:** Header section (`HeaderHome.tsx`)
**Current:** Gray placeholder box with text
```tsx
<div className="aspect-video flex items-center justify-center bg-gradient-to-br from-space-900 to-space-800">
  <p>[ Hero Animation / Screenshot Placeholder ]</p>
</div>
```
**What to add:**
- **Option A (Recommended):** Lottie animation of astronaut tending plants in zero gravity
  - File: `.json` Lottie file
  - Library: `lottie-react` or `@lottiefiles/react-lottie-player`
  - Animation should loop subtly
- **Option B:** High-quality illustration/3D render
- **Option C:** Animated dashboard screenshot/mockup
- **Style:** Should feel space-themed, bio-inspired, modern
- **Dimensions:** 16:9 aspect ratio, optimized for web

---

### 3. **Feature Card Icons**
**Location:** Layout1 section (Features)
**Current:** Simple SVG placeholder icons (search, graph, brackets)
**What to enhance:**
- Replace with custom icons or use a premium icon set like:
  - [Lucide Icons](https://lucide.dev/) (recommended)
  - [Heroicons](https://heroicons.com/)
  - Custom designed icons matching your brand
- Suggested icons:
  - **Search card:** Microscope, DNA strand, or sparkle/AI icon
  - **Graph card:** Network nodes, constellation, or 3D graph
  - **Design card:** Layers, zap/lightning (for speed), or palette

---

### 4. **Layout2 Tab Content Images**
**Location:** `Layout2.tsx` (Summarize/Visualize/Connect tabs)
**Current:** Placeholder images in each tab
```tsx
<img
  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
  className="w-full object-cover"
  alt="Relume placeholder image"
/>
```
**What to add for each tab:**
- **Summarize Tab:**
  - Screenshot of AI summary interface
  - Example: Chat-style summary with highlighted insights
  - Or: Animated diagram showing text → summary transformation
  
- **Visualize Tab:**
  - Interactive chart/graph mockup
  - Example: 3D knowledge graph or timeline visualization
  - Or: Data visualization dashboard
  
- **Connect Tab:**
  - Network diagram showing research connections
  - Example: Node graph linking studies, organisms, missions
  - Or: Interactive exploration interface

**Tips:**
- Use actual product screenshots if available
- Otherwise, create mockups in Figma
- Maintain consistent aspect ratio (square or 4:3)
- Add subtle shadows or borders for depth

---

### 5. **Testimonial Avatars**
**Location:** `TestimonialHome.tsx`
**Current:** Placeholder avatar images
```tsx
<img
  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
  alt="Testimonial avatar"
  className="mb-4 size-12 min-h-12 min-w-12 rounded-full object-cover"
/>
```
**What to add:**
- Professional headshots or avatar illustrations
- 3 testimonials currently displayed
- **Options:**
  - Real user photos (with permission)
  - Professional stock photos (space scientists)
  - Illustrated avatars (more brand-consistent)
  - Generated avatars (e.g., from Notion-style avatar generators)
- Dimensions: 48x48px minimum, square
- Style: Should feel professional, diverse representation

---

### 6. **Footer Logo**
**Location:** `FooterHome.tsx`
**Current:** Same placeholder as navbar
**What to add:**
- Same logo as navbar, or a simplified version
- Consider a monochrome/single-color variant for footer

---

## Optional Enhancements

### 7. **Favicon & Meta Images**
- Create favicon set (16x16, 32x32, 180x180 for Apple)
- Open Graph image for social sharing (1200x630px)
- Place in `/public` folder

### 8. **Loading States**
- Add skeleton loaders for images while they load
- Use `motion` fade-in animations

### 9. **Background Patterns**
- Consider adding subtle grid or dot pattern in background
- Space-themed texture overlay (stars, nebula)

### 10. **Micro-interactions**
- Hover effects on cards (already partially implemented)
- Click animations on buttons
- Parallax scrolling effects

---

## Asset Recommendations

### Lottie Animations
- [LottieFiles Marketplace](https://lottiefiles.com/)
- Search for: "astronaut", "space plant", "biology", "laboratory"
- Free options available, premium for exclusive use

### Icon Libraries
```bash
# If using Lucide
npm install lucide-react
```

### Image Optimization
- Use Next.js Image or similar for automatic optimization
- WebP format for better compression
- Lazy loading for below-the-fold images

---

## Implementation Priority

1. **Critical (Do first):**
   - Logo (navbar + footer)
   - Hero animation/illustration
   
2. **High Priority:**
   - Feature card icons
   - Tab content images (at least 1 per tab)
   
3. **Medium Priority:**
   - Testimonial avatars
   - Favicon/meta images
   
4. **Nice to Have:**
   - Background effects
   - Additional micro-interactions

---

## Design Resources

### Color Palette (Implemented)
- **Primary Accent:** `#00e7b3` (Biosphere green)
- **Secondary Accent:** `#8b5cf6` (Cosmic purple)
- **Dark BG:** `#020617` (Space navy)
- **Light BG:** `#ffffff` (Pure white)
- **Borders:** Semi-transparent grays (theme-aware)

### Typography
- **Font:** Inter (system default)
- **Headings:** 700 weight, tight letter-spacing
- **Body:** 400-500 weight, relaxed line-height

### Spacing
- Generous whitespace (following Vercel/Linear style)
- Consistent padding: 16px/24px/32px increments

---

## Testing Checklist

- [ ] Logo displays correctly in both themes
- [ ] Hero animation/image loads and plays smoothly
- [ ] All feature card icons are visible and themed
- [ ] Tab images load without layout shift
- [ ] Testimonial avatars are crisp on retina displays
- [ ] Theme toggle works across entire page
- [ ] Animations are smooth (60fps)
- [ ] Responsive on mobile, tablet, desktop

---

**Next Steps:**
1. Gather/create the assets listed above
2. Replace placeholder URLs with your asset paths
3. Test thoroughly in both light and dark modes
4. Optimize images for web performance
5. Consider adding a loading state for the hero section

For the Lottie animation, you can integrate it like this:
```bash
npm install lottie-react
```

```tsx
import Lottie from 'lottie-react';
import astronautAnimation from '@/assets/animations/astronaut.json';

<Lottie 
  animationData={astronautAnimation}
  loop={true}
  className="max-w-3xl mx-auto"
/>
```

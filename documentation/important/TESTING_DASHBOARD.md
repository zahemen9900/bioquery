# Testing the Dashboard

## Quick Start

1. **Enable Dashboard View**
   
   In `src/App.tsx`, change line 12:
   ```tsx
   const isAuthenticated = true  // Change from false to true
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Test Routes**
   - Visit `http://localhost:5173/discover` - Main chat interface
   - Visit `http://localhost:5173/collections` - Artifacts library

## Features to Test

### Sidebar Navigation
- ✅ Logo and brand
- ✅ Collections link (highlights when active)
- ✅ Chats section with "New chat" button
- ✅ Recent chats list (mock data)
- ✅ User avatar menu at bottom
- ✅ Mobile: hamburger menu opens Sheet drawer
- ✅ User menu: Settings modal + Sign out option

### Discover Page

**Hero State (no messages):**
- ✅ Animated cosmic background with floating gradients
- ✅ Centered sparkle icon with scale animation
- ✅ Large heading and description
- ✅ Elegant input card with focus states
- ✅ Suggestion chips (click to populate input)
- ✅ Send button (paper airplane icon)

**Chat State (after sending message):**
- ✅ User messages (right-aligned, biosphere-500 background)
- ✅ Assistant messages (left-aligned, card with avatar)
- ✅ Loading animation (spinning sparkle + bouncing dots)
- ✅ Source badges and confidence indicators
- ✅ Fixed bottom input bar
- ✅ Smooth animations with AnimatePresence

### Collections Page
- ✅ Search bar with magnifying glass icon
- ✅ Filter button
- ✅ Tabs: All, Notes, Graphs, Visualizations
- ✅ Artifact cards with:
  - Gradient icon based on type
  - Title, description, tags
  - Source count and timestamp
  - Hover effects (border + shadow)
- ✅ Empty state with CTA button
- ✅ Responsive grid layout

## Keyboard Shortcuts
- `Enter` in chat input → Send message
- `Shift + Enter` → New line (not yet implemented)

## Theme Support
All pages support light/dark theme via the ThemeToggle component in the top navbar.

## Next Steps
1. Wire up Supabase auth state (replace `isAuthenticated` with actual session check)
2. Connect Discover to LLM API with RAG pipeline
3. Store artifacts in Supabase
4. Implement real chat history
5. Add artifact detail drawer
6. Create settings modal content

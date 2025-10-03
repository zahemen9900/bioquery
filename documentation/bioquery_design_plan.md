# BioQuery — App & Level Design Philosophy

## Design Vision

BioQuery should feel **premium, minimalist, and modern** — the type of product you’d expect from a top-tier tech startup. The app is not just a tool; it’s an experience. Our design should inspire trust and curiosity, signaling to users that they’re exploring the future of research through a platform that’s both cutting-edge and intuitive.

Key inspirations: **Vercel, Cursor, Linear, Notion** — clean typography, intentional whitespace, subtle animations, and a sense of calm elegance.

---

## Core Design Principles

1. **Minimalism with Depth**

   * Keep surfaces uncluttered.
   * Use whitespace as a feature, not an afterthought.
   * Focus attention with bold typography and clear hierarchy.

2. **Tech-Forward Aesthetic**

   * Dark/light themes out of the box.
   * Subtle gradients, glassmorphism effects, and accent colors (bio-inspired green/blue hues).
   * Smooth micro-interactions (hover states, card reveals, modal transitions).

3. **Conversational First**

   * Chat interface is the main entry point.
   * Visualizations, summaries, and artifacts appear naturally inside chat as rich cards.
   * Encourage a sense of dialogue with the research, not just data retrieval.

4. **Premium Details**

   * Lottie animations for onboarding (e.g., astronaut/plant growth loop).
   * Animated transitions between pages (Framer Motion).
   * Crisp icons (Lucide) and carefully tuned typography (e.g., Inter or Geist).

---

## App Flow & Levels

### Level 1: **Landing Page**

* Bold headline: *“Exploring Life Beyond Earth, One Question at a Time.”*
* Hero animation (Lottie): astronaut tending a small plant in zero gravity.
* CTA: *“Get Started”* → Auth flow.
* Secondary: short scroll explaining value props (Summarize, Explore, Visualize).

### Level 2: **Dashboard (Home)**

* Default to **Chat Interface**.
* Left sidebar: Chats, Saved Artifacts, Settings.
* Main panel: conversational UI.
* Messages styled as clean bubbles, but with expandable rich cards for:

  * Summaries
  * Knowledge graphs (interactive)
  * Charts/tables
* Right sidebar (collapsible): filters (organism, year, mission type).

### Level 3: **Explore Tab**

* Full-page interactive knowledge graph.
* Option to toggle graph types: entities, research themes, timeline.
* Smooth zoom/pan animations.

### Level 4: **Artifacts/Dashboard Tab**

* Gallery of saved artifacts.
* Card layout: each artifact shows type (summary, viz, doc) and date.
* Clicking opens detail view.
* Option: *“Pin to Dashboard”* directly from chat.

### Level 5: **Settings/Profile**

* Clean profile editor (nickname, avatar, theme preferences).
* Toggles for guided tour popups.
* Data export/download option.

---

## UI Toolkit

* **ShadCN + Tailwind**: base components.
* **Framer Motion**: page and component animations.
* **Lucide Icons**: clean, consistent iconography.
* **Lottie Animations**: onboarding & micro brand moments.
* **Typography**: Inter (system default) or Geist for a premium dev-tool feel.

---

## Design Moodboard (keywords)

* *Minimalist*
* *Biotech-inspired*
* *Astronautics*
* *Interactive cards*
* *Professional but playful*

---

## Next Steps

1. Create a design mockup (Figma/Whimsical) to validate the flow.
2. Define core color palette (deep space navy, vibrant green, off-white, accent purple).
3. Build Landing + Chat UI skeletons in Vite/React.
4. Integrate first Lottie animation for onboarding.

---

**The BioQuery experience should feel like conversing with a futuristic research assistant — elegant, intuitive, and inspiring.**

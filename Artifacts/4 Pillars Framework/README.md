# 4 Pillars Framework - Interactive Tools & Data

This folder contains the interactive HTML tools and structured data built during the founding conversation (March 24, 2026).

## Tools

### 1. Quality Manifesto Widget (`quality_manifesto_widget.html`)
Interactive filterable card interface for the Quality Manifesto:
- Filter by category (definition, practice, integrity, collaboration)
- Random daily selection
- Export statements as images for social media
- Mobile-responsive dark mode design

**Usage:** Open in any web browser. No server required.

### 2. Leverage Points Decision Tool (`leverage_points_tool.html`)
Analyzes decisions using Donella Meadows' leverage points framework:
- Input any decision or problem
- Identifies current leverage level (1-12)
- Suggests higher-leverage alternatives
- Shows real examples from creative practice

**Usage:** Open in any web browser. Helps identify where to intervene in systems.

### 3. Theme Planning Tool (`theme_planner.html`)
Interactive planner for scheduling 52 weeks of 4 Pillars themes:
- Browse all 40 themes (20 fundamental, 20 deep)
- Plan monthly philosopher arcs (3 months study + 1 month integration)
- Track completed themes
- Filter by difficulty and status
- Visualize year-long teaching schedule

**Usage:** Open in any web browser. Saves state to browser localStorage.

### 4. Cross-Domain Resonances Network (`resonances_network.html`)
Interactive network visualization of cross-domain connections:
- Visual map of all resonances, themes, patterns, and sources
- Physics-based layout shows natural clustering
- Click any node to see details and connections
- Filter by view mode (all/resonances/themes/patterns)
- Focus on pattern families (yielding space, mutual support, etc.)
- Pan, zoom, drag nodes to explore

**Usage:** Open in any web browser. Interactive physics simulation.

### 5. Source Library Reading Tool (`source_library_tool.html`)
Interactive guide to the philosophical and artistic sources:
- Browse all sources organized by category (Systems Thinkers, Philosophers, Musicians, Artists)
- Core Five highlighted with 3-month deep reading approach
- Track reading progress with checkboxes (saved to browser)
- View suggested yearly reading arcs (quarterly deep dives + integration)
- Filter by category or focus on Core Five
- See statistics (total sources, completed, core progress)

**Usage:** Open in any web browser. Saves reading progress to localStorage.

## Data

### Weekly Themes Database (`weekly_themes_database.json`)
Complete structured data for all 40 weekly themes:
- **20 Fundamental Themes:** Accessible entry points using familiar objects
- **20 Deep Themes:** Advanced musicianship integrated with philosophy/science

Each theme includes:
- Title, subtitle, philosopher
- Music to study
- Musical and philosophical readings
- Technical and philosophical concepts
- Cross-domain connections
- Four pillars integration details

**Usage:** Can be loaded by the theme planner tool or used to build custom applications.

## Related Palace Entries

**Phase 1 - Core Framework:**
- [[Quality Manifesto]] - The philosophical foundation
- [[Leverage Points Framework]] - Systems thinking for creative practice
- [[AI Partnership Philosophy]] - How we built these together
- [[4 Pillars Framework - The Founding Conversation]] - The breakthrough that spawned everything

**Phase 2 - Weekly Themes:**
- [[Weekly Themes Database]] - Hub entry for all themes
- [[The Kick Drum Paradox]] - Week 1: Leverage points
- [[Four on the Floor]] - Week 2: Repetition as meditation
- [[The First Sound]] - Week 3: Beginnings shape everything
- [[High Pass Low Pass]] - Week 4: Subtraction reveals
- [[The 808]] - Week 5: Limitations become signature

**Phase 3 - Cross-Domain Resonances:**
- [[Cross-Domain Resonances]] - Hub entry for pattern network
- [[Sidechain ↔ Conversation]] - Yielding space pattern
- [[Dovetail Joint ↔ Counterpoint]] - Mutual support pattern
- [[Cooking ↔ Mixing]] - Irreversible processes pattern
- [[Kick Drum ↔ Foundation]] - Structural dependency pattern
- [[Reverb ↔ Space-Time]] - Space-time unity pattern

**Phase 4 - Source Library:**
- [[Source Library]] - Hub entry for all sources
- [[Donella Meadows]] - Systems thinking, leverage points
- [[Shunryu Suzuki]] - Zen practice, beginner's mind
- [[Marcus Aurelius]] - Stoic practice, intentional beginning
- [[Lao Tzu]] - Taoist philosophy, subtraction
- [[Brian Eno]] - Constraints, generative systems
- [[Christopher Alexander]] - Pattern language, organic growth

## Technical Details

All HTML tools are standalone files with embedded CSS and JavaScript:
- No external dependencies
- No server required
- Works offline
- Mobile-responsive (except network viz - desktop recommended)
- Dark mode optimized
- State persistence via localStorage where applicable

The JSON database follows a clear schema with fundamental and deep themes separated, complete metadata, and extensible structure for future additions.

The network visualization uses HTML5 Canvas with custom physics simulation for node layout and interaction.

The source library tool tracks reading progress and provides structured yearly reading arcs for deep engagement.

Built collaboratively by Loudon and Claude on March 24, 2026.

# DKR LIMS Workflow

## Current State
The Dashboard page exists with stats cards, a workflow pipeline strip, tabbed bar/donut charts, a Camunda BPM widget, a Recent Samples table, and a My Tasks Today panel. The design uses a teal-to-blue sidebar, card-based layout, and colored left-border accents on stat cards.

## Requested Changes (Diff)

### Add
- White header bar (#FFFFFF) with soft box-shadow
- Very light gray page background (#F9FAFB)
- Redesigned stat cards: soft pastel icon backgrounds (blue, orange, purple, green), no left border accent, neumorphic/glassmorphism shadow style
- Workflow Pipeline section: pill-shaped connected steps with sample counts and "View Samples" links per stage
- My Tasks panel: table layout (task, sample ID, stage, due time, action buttons)
- Recent Samples panel: table (sample ID, customer, sample type, date, COA dropdown)
- Right-side vertical utility panel: Recent Activities/Audit Log, Quick Tools (Unit Converter, Percentage Calculator, Currency Converter, Scientific Calculator), Shortcuts, Help, Settings sections
- Sample Distribution bar chart (bottom section)
- Camunda BPM Status progress indicators (bottom section)

### Modify
- Dashboard layout: change from single-column to main content + right utility sidebar (3-col grid)
- Stat cards: remove colored left borders, add soft pastel icon containers, minimal typography style
- Overall background: from bg-background to #F9FAFB
- Chart section: move to bottom, side by side with Camunda BPM

### Remove
- Tabbed bar/donut chart in the center (move to bottom)
- Hero/greeting banner (already removed in v16)

## Implementation Plan
1. Redesign Dashboard.tsx with new 3-column layout: main content (left 2/3) + right utility sidebar (1/3)
2. New stat cards with pastel icon colors (blue/orange/purple/green), soft shadows, minimal type
3. Workflow Pipeline: horizontal connected pill steps with chevrons, sample counts, "View Samples" link per stage
4. My Tasks table panel: columns — Task, Sample ID, Stage badge, Due Time, Action button
5. Recent Samples table panel: columns — Sample ID, Customer, Sample Type, Date, COA dropdown button
6. Bottom row: Sample Distribution bar chart (left) + Camunda BPM Status (right)
7. Right utility sidebar: Recent Activities list, Quick Tools grid (4 tool cards), Shortcuts list, Help + Settings links
8. Apply #F9FAFB page background and white card surfaces

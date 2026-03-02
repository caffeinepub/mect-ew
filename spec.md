# Specification

## Summary
**Goal:** Display geographic view breakdown data for all existing video views in the admin Video Management Panel, including views recorded before geographic tracking was introduced.

**Planned changes:**
- Update the backend (`main.mo`) geographic view query to return all view records regardless of whether they have country data, including records with empty or null country fields.
- Update `VideoManagementPanel.tsx` to display the geographic breakdown panel for any video with existing view records, grouping entries with missing/empty/null country values under an "Unknown" label.
- Ensure the breakdown list includes "Unknown" entries sorted by view count descending alongside known countries.

**User-visible outcome:** Admin users can now see the geographic breakdown panel for videos that already had recorded views before location tracking was added, with views that have no country data shown as "Unknown" in the breakdown list.

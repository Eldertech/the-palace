# Hibernation Queue

This folder is a palace inbox. When a conversation completes its deposit and hibernates, it writes a small structured record here instead of attempting to update the full Harvest Log directly.

During the next Weave — or any time it's convenient — Claude reads these files, updates the Harvest Log, and deletes the processed records.

**Do not add these files to the Obsidian graph.** They are transient handoff artifacts, not palace entries.

## Processing a queue item

1. Read the `.md` file in this folder
2. Update the Harvest Log:
   - Set `deposit_status: done` for the item ID
   - Update `deposit_notes` with the summary provided
   - Add the Session History row provided
   - Update the Frontier if needed
3. Check whether the deposited palace files have proper frontmatter — add if missing
4. Delete the queue file once processed

Queue files use the naming convention: `[HarvestID]_[theme-slug].md`

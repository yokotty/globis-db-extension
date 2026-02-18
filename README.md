# globis-db-extension

Chrome extension (Manifest V3) for GLOBIS discussion board usability.

## Behavior

- Initial load:
  - Wait briefly, then click `more` automatically for unliked posts only.
  - Unliked posts are shown in full text.
- When a post is liked:
  - The like click is used as a trigger.
  - If the post is currently expanded (`閉じる` state), the extension collapses it back to 3 lines.
- Scope:
  - Like detection targets the post's main like chip (not comment like chips).
  - Existing native `more`/`閉じる` controls are used.

## Current logic summary

- `unliked` post: auto-click `more` and keep expanded.
- `liked` post: keep collapsed, and auto-collapse on like click trigger.
- Dynamic list updates are observed and reprocessed.

## Install (Developer mode)

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select this folder:
   `/Users/yokota.jumpei/Repositories/globis-db-extension`

## Test

```bash
npm test
```

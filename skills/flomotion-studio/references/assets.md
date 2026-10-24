# Assets: where every graphic and file comes from

A SaaS video needs a lot of pictures: logos, icons, product screenshots, a few photos, charts. Pull them with the tools, never from memory, never by drawing a brand logo yourself. Everything pulled is recorded in the ledger with its licence; CC-BY items are credited in the render's credits file; `lint` fails on an unrecorded file.

## Where each thing comes from

| Need | First choice | Tool | Notes |
|---|---|---|---|
| The person's own logo and brand images | Their files | `asset_import {source, rights}` | Vector (SVG) if they have it. They say whether the files are theirs or licensed. |
| Their brand colours, fonts, logo | Their website | `brand_extract {url, permission:true}` | Only their own site. It reports what the page uses today; confirm the real accent with them before building a look (see `looks.md`, brand override). Logos land in `assets/brand/`. |
| Product UI | A screenshot of the real app | `asset_capture {url, permission:true, selector?, hide?}` or `asset_import` | 2x sharp. Pages behind a login: they take the screenshot. Hide cookie banners and chat widgets with `hide`. If the UI is not ready or is private: build a skeleton UI with `UIMock`, `Card`, `Chip` and `RoundRect`, and say it is a mock. |
| Icons (feature icons, bullets, arrows) | Open icon sets | `asset_search {kind:"icon"}`, `asset_get {ref, color, height}` | Lucide, Tabler, Phosphor, Material and more. Colour them with the look's accent (`color`). One set per video so the stroke weight matches. |
| Emoji | Open emoji sets | `asset_search {kind:"emoji"}` | Use sparingly; they carry their own colours. |
| Other companies' logos ("works with Slack", customer strip) | Only with permission | `asset_search {kind:"logo"}`, `asset_get {permission:true}` | The artwork is openly licensed but the brand is a **trademark**. Ask the person whether they have permission or the brand's guidelines allow it; if not, use the name in text. Never for a competitor comparison without them saying so. |
| Photos (people, desks, places) | Open or stock photos | `asset_search {kind:"photo"}`, `asset_get` | Openverse (CC0, CC-BY) with no key; Pexels with a key. Check the picture in a frame: a text match can be the wrong picture. No photos of identifiable people for testimonials: a quote card has no face. |
| Illustrations | Openverse `illustration`, or draw | `asset_search {kind:"illustration"}` | Or build with `Circle`, `Rect`, `Path`, `Line` and gradients; that always matches the look. |
| Backgrounds, shapes, gradients, grids | The components | `Rect` (gradient fill), `Circle`, `Path`, `Grain` | No download needed. This is most of a clean look. |
| Charts and numbers | The person's data | `Chart`, `Counter`, `ProgressRing` | Data comes only from them, with a source. |
| Voice, transcript, sounds | Their own files, or a service | `voice_import`, `transcript_import`, `sound_import`, `sound_search` | See `sound.md`. |

## The asset plan (write it into `storyboard.json` at G4)

For every beat list: the graphics it needs, the source from the table, who must supply it, and whether it needs permission. Example:

```json
{ "beat": 3, "assets": [
  { "need": "product dashboard shot", "source": "asset_capture", "url": "https://app.example.com/board", "permission": "asked at G0", "status": "to capture" },
  { "need": "calendar icon", "source": "asset_get iconify:lucide/calendar", "color": "$brand.accent", "status": "pulled" },
  { "need": "customer logos x3", "source": "asset_import", "status": "waiting for the person" }
]}
```

Never ship a placeholder as if it were final: a missing logo is a visible "LOGO" box and a line in "Needs your review".

## Rules

1. **Look at what you pulled.** Place it in a frame (`frame_render`) and describe what you see; reject the wrong picture.
2. **One icon set per video**, one stroke weight, colours from the look.
3. **Permission is the person's to give.** For screenshots, brand extraction and other companies' logos, ask first and pass `permission:true` only after a yes. Record the yes in `LOG.md`.
4. **Licences:** CC0, permissive (MIT, Apache, ISC) and CC-BY are allowed by default; share-alike, non-commercial and unknown licences are refused (`license_blocked`). `flomotion.json` can narrow this with `assetLicenses`.
5. **Credits:** CC-BY assets are credited automatically; sources that ask for a credit (Pexels) are listed as recommended. Tell the person where the credits file is.
6. **Size:** photos are scaled to 2400 px on the long side. Screenshots at 2x of a 1440 px page are fine; do not capture at 3x for a 1080 px frame.
7. **No remote files at render time.** Everything is on disk; a `src` that starts with `http` fails the build.

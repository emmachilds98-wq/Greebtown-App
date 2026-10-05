# Dave's Wardrobe: review and upgrade plan

The live version is the claude.ai artifact
<https://claude.ai/artifact/8uqcGr2eNmzbQv8UVBshY2>. This folder is a backup of
it, so the page and its data can be used or rebuilt outside Claude.

| File | What it is |
|---|---|
| `page.html` | The page source as published (version 8, 5 Oct 2026). |
| `data/items.json` | All 794 picks, keyed by id, as stored in the artifact's `items` collection. |
| `data/outfits.json` | All 110 outfits from the `outfits` collection. |
| `tools/fetch_photos.py` | Downloads listing photos and packs them for the page (step 2 below). |

The shared shortlist, Dave's thumbs and saved outfits (`saved`, `votes`,
`myfits`) are not copied here. They change from day to day and belong to the
people using the page.

---

## 1. Review of the current helper (before this round)

**Works well**
- Seven styles (Classic, Casual, Street, Minimal, Rave, Outdoors, Lounge). Each one has its own
  guidance on colours, what to wear, what to avoid and where to spend.
- Outfits are drawn on a figure of Dave, and each piece is numbered, priced and linked. Running
  totals show the saving against full price.
- The builder has slots, a colour for each piece and a "suggest under £X" search. The
  "one piece, many outfits" view shows cost per wear.
- The shortlist is shared and tracks what has been bought, and Dave's thumbs feed back into the
  ranking.
- The size data is honest: an "in his size" line where the shop shows stock, and his usual size
  where it doesn't.

**Gaps found**
1. **No product photos.** Every card was text only, and the drawings were the only visuals. The
   artifact sandbox blocks images from shop websites, so photos cannot simply be hotlinked. They
   have to be downloaded and published with the page.
2. **Shop coverage was uneven.** About 48 shops had picks, but nearly half the picks were from
   ASOS, M&S or Uniqlo. Many shops in the "Where to look" directory (Arket, COS, Gap, Joules,
   FatFace, Loake, Dr Martens, Gymshark, Decathlon and others) had no picks at all.
3. **No supermarket or value tier.** Tu, George and F&F are some of the best value for basics
   and knitwear, and none of them were covered.
4. **"New this week" is busy.** Over 200 picks carry `added: 2026-10-05`. That is right for a
   big refresh, but the weekly refresh should only set `added` on picks that are actually new, or
   the New filter stops meaning much.
5. **Sizes are still estimates.** The shirt collar and jacket chest are marked "to confirm". Until
   Dave is measured, "in his size" is only as good as the guess.
6. **Some pages are near their load limit.** Picks load as two queries of up to 1,000 each
   (clothes: 466, everything else: 315). That leaves room for about 500 more clothes picks before
   the split needs a third query.

## 2. Done in this round (5 Oct 2026)

- **Photo support in the page.** Each pick card now has a picture area at the top. Outfit rows,
  the builder list and the shortlist get a thumbnail for each piece.
  - The page shows the listing photo when one is stored: an item's `img` field, or an entry in a
    photo pack named by the `meta/photos` document.
  - When there is no photo, or a photo fails to load, the card shows a drawing of the garment in
    its colour.
  - Cards with a real photo are labelled "Shop photo", and the footer explains the difference.
- **36 new picks from 20 shops that had no picks before:** Arket, COS, Hawes & Curtis, Loake
  (factory outlet), Jean Store (Dr Martens), Seasalt, Decathlon, FatFace, Joules, Zalando (New
  Balance, BDG), Office (Vans), Gymshark, Tu at Sainsbury's, George at Asda, Rohan, Summits
  (Berghaus), White Stuff and Stuarts London (Timberland).
  - Picks span all seven styles, from a £9.99 Decathlon fleece to £169 Dr Martens.
  - Each pick has a real listing link and the date its price was seen. Some prices are from
    May to August, and the card shows that date.
- **11 new outfits**, mostly built from the new picks:
  - The supermarket upgrade, Coastal weekend, Three-in-one walk, Docs and black denim, Old Skool
    Saturday, Quarter-zip pub
  - Film night, Charcoal and navy, Wet weekend, Green cord and navy, and About £100, all new
- **"Where to look" directory:** grew from 89 to 104 shops. Two new groups were added:
  "Supermarkets and value" and "Big multi-brand shops". Counts now show for the new shops.
- Totals: **781 picks, 105 outfits, 66 shops with picks.**

## 2b. Done in round two (5 Oct 2026, later)

- **Shop filter** in Picks. It lists the shops with picks in the current style or search, busiest
  first, with counts.
- **Compact grid** toggle in Picks. It shows a denser grid with picture, name, price and shop,
  for browsing on a phone. Each viewer's choice is remembered on their own device.
- **Price-drop watch on the shortlist.** Saving a pick now stores its price, and the shortlist
  shows "Down £X since it was saved" when the price falls. This only covers picks saved from now
  on.
- **Old-price warning.** Cards whose price was last seen more than 30 days before the latest
  check say so, in amber, with "Check before buying".
- **13 more picks from 8 more shops:** Zara, The North Face, Peregrine, Mountain Warehouse,
  Converse, Foot Locker (New Balance 740), Sports Direct (£11 windbreaker) and END. (YMC), plus
  Next.
- **5 more outfits:** Black bomber, white tee; Made in England; Cold festival queue; Warehouse
  night under £100; Chucks and black denim.
- Totals: **794 picks, 110 outfits, 74 shops with picks.**

## 2c. Photos (5 Oct 2026, evening)

- Network access was opened, and `fetch_photos.py --browser` ran over every pick.
- **483 of 794 picks now show the shop's own listing photo** (version 8 of the page, two packs
  of about 3.9 MB in total, roughly 8 KB per photo).
  - Every Uniqlo pick has a photo, and 118 of 120 from M&S.
  - The photos also show as thumbnails in outfits, the builder, the shortlist, "This week" and
    "One piece, many outfits".
- **Still drawings:**
  - ASOS (195 picks): it stalls every connection from cloud servers.
  - Pre-owned searches: they have no single photo.
  - Picks linking to brand or category pages (most M and M Direct ones).
  - Shops that block even a headless browser: Arket, COS, Zara (mostly), Next, Joules,
    The North Face, Converse, Decathlon, Adidas, Office, Zalando, H&M, Hawes & Curtis,
    John Lewis and a few others.
- 42 photos that several picks shared were dropped, because a shared photo is a shop logo or
  banner rather than the product.
- To fill the gaps, run the tool from a home computer: shops rarely block home broadband the way
  they block cloud servers. Then republish the packs.

## 3. Next steps

### Step 1: Fill in the photos (the main one left)
The page is ready for photos; it is waiting on downloads. This session's cloud environment could
not reach any shop site because of its network policy, so the photo files have not been made yet.

1. Give a session network access to the shops. Either:
   - choose **Full** network access in the cloud environment settings (environment menu in the
     session title bar, then Edit), or
   - choose **Custom** and add the shop domains plus their image hosts. The shop domains are
     listed by `python3 -c "import json,re;print(sorted({re.sub(r'^https://([^/]+)/.*',r'\1',v['url']) for v in json.load(open('data/items.json')).values()}))"`.
     Image hosts seen so far include `images.asos-media.com`, `asset1.cxnmarksandspencer.com`,
     `image.uniqlo.com`, `cdn.shopify.com`, `img01.ztat.net`, `contents.mediadecathlon.com` and
     `cdn.media.amplience.net`. After a run, `report.json` lists anything still blocked.
2. Run `pip install pillow && python3 tools/fetch_photos.py --out photos`. It writes
   `photos/pack-NN.json` (about 3 MB each, roughly 120 to 150 photos per pack) and
   `photos/meta-photos.json`.
3. Republish the page with the packs as supporting files (`photos/pack-01.json` and so on).
   Then write `meta/photos` = the contents of `meta-photos.json`. Open pages pick the photos up
   live.
4. Expect about 85 to 90% coverage. Pre-owned picks and links to category pages (FatFace cords,
   for example) keep their drawings.

Alternative if network access stays off: ask Claude in a normal chat to save the photos one shop
at a time, or upload them yourself into the artifact (it would need the `assets` capability, and
that makes the page organisation-only, so not shareable by public link).

### Step 2: Data hygiene (each weekly refresh)
- Re-check every pick whose `checked` date is over 30 days old: prices, links and his size.
  Remove dead links rather than leaving "No longer listed" gaps in outfits.
- Set `added` only on picks that are actually new (see gap 4), so "New this week" means
  something again.
- Store `img` (or refresh the packs) at the same time as the price check, so photos stay current
  with the listing.
- ~~Add a "price seen over a month ago" note to old cards.~~ Done in round two.

### Step 3: Fit and sizes
- Measure Dave: neck plus half an inch, chest under the arms, inside leg. Then update
  `meta/profile` and drop the "to confirm" notes.
- Add a per-shop size note (for example, "Gymshark runs large: M" and "Timberland: UK 10.5"),
  stored as `sizeNote` on the pick, so the card can show it next to his usual size.

### Step 4: Page features worth adding
1. ~~**Photo-first view.**~~ Done in round two as the compact grid.
2. **Photo strip on outfit cards:** under the drawing, a row of the pieces' listing photos, once
   coverage is good.
3. ~~**Price-drop watch on the shortlist.**~~ Done in round two.
4. **"Shop by budget" quick sets:** an outfit for £60, £100 or £150, drawn from the builder's
   suggestion engine and refreshed weekly.
5. ~~**Shop filter in Picks.**~~ Done in round two.

### Step 5: More stores to add next
These are in the directory but still have no picks: Gap, Levi's, Dr Martens direct, Vans,
New Balance direct, Timberland direct, Berghaus direct, Urban Outfitters, Pull&Bear, Bershka,
TK Maxx, BrandAlley, Very and F&F. The search index had only old or US prices for Gap and Levi's
this round. Check them again when they can be reached directly. Next round: aim for 3 to 5 picks each, and favour sale stock and
pieces that slot into existing outfits.

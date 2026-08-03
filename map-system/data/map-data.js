// Generated from map-system/data/map-document.json by scripts/build-map-data.mjs. Do not edit directly.
window.GREEBTOWN_MAP_DOCUMENT = {
  "schemaVersion": "1.0.0",
  "documentId": "greebtown-2026-map",
  "coordinateSystem": {
    "name": "schematic-percent-v1",
    "unit": "map-unit",
    "origin": "top-left",
    "xRange": [
      0,
      100
    ],
    "yRange": [
      0,
      100
    ],
    "description": "Matches the existing Greebtown schematic coordinate system. This document does not store latitude/longitude; the renderer owns the shared conversion."
  },
  "layers": [
    {
      "id": "terrain",
      "name": "Terrain",
      "order": 10,
      "visible": true,
      "locked": false
    },
    {
      "id": "districts",
      "name": "Districts",
      "order": 20,
      "visible": true,
      "locked": false
    },
    {
      "id": "paths",
      "name": "Paths",
      "order": 30,
      "visible": true,
      "locked": false
    },
    {
      "id": "structures",
      "name": "Structures",
      "order": 40,
      "visible": true,
      "locked": false
    },
    {
      "id": "amenities",
      "name": "Amenities",
      "order": 50,
      "visible": true,
      "locked": false
    },
    {
      "id": "labels",
      "name": "Labels",
      "order": 60,
      "visible": true,
      "locked": false
    }
  ],
  "objects": [
    {
      "id": "stage-grand-central",
      "type": "stage",
      "name": "Grand Central",
      "position": {
        "x": 72,
        "y": 30
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 35,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Boomtown's original main stage, at the north-east end of the Oldtown run.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified against the official-map evidence; renderer source of truth."
      }
    },
    {
      "id": "stage-lions-den",
      "type": "stage",
      "name": "The Lion's Den",
      "position": {
        "x": 83,
        "y": 55
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Temple Valley main stage, south of Helix.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified official-map relationship."
      }
    },
    {
      "id": "stage-hydro-xl",
      "type": "stage",
      "name": "Hydro XL",
      "position": {
        "x": 11,
        "y": 46
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Downtown stage south-west of Metropolis.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified official-map relationship."
      }
    },
    {
      "id": "stage-anara-forest",
      "type": "stage",
      "name": "Anara Forest",
      "position": {
        "x": 85,
        "y": 22
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Woodland stage toward Temple Valley Camping.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified official-map relationship."
      }
    },
    {
      "id": "stage-hidden-woods",
      "type": "stage",
      "name": "Hidden Woods",
      "position": {
        "x": 18,
        "y": 2
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Woodland stage north of Letsbe Avenue and Botanica.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified official-map relationship."
      }
    },
    {
      "id": "stage-nexus",
      "type": "stage",
      "name": "NEXUS",
      "position": {
        "x": 23,
        "y": 22
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 20,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Botanica main stage, west and slightly south of the district label.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified official-map relationship."
      }
    },
    {
      "id": "stage-helix",
      "type": "stage",
      "name": "Helix",
      "position": {
        "x": 78,
        "y": 52
      },
      "dimensions": {
        "width": 6,
        "height": 4
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Open-grass stage on the Quantum to Lion's Den corridor.",
        "category": "stage",
        "mapRole": "main-stage",
        "accessibility": "",
        "notes": "Verified official-map relationship."
      }
    },
    {
      "id": "stage-spectrum-360",
      "type": "stage",
      "name": "Spectrum 360",
      "position": {
        "x": 37,
        "y": 32
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Area 404 container arena.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-tangled-roots",
      "type": "stage",
      "name": "Tangled Roots",
      "position": {
        "x": 51,
        "y": 14
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Northern woodland-stage cluster.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-full-moon-ballroom",
      "type": "stage",
      "name": "Full Moon Ballroom",
      "position": {
        "x": 62,
        "y": 26
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Hilltop clearing beside the Hide Out route.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-rose-and-clown",
      "type": "stage",
      "name": "Rose and Clown",
      "position": {
        "x": 35,
        "y": 20
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Botanica east-arc stage.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-fools-leap",
      "type": "stage",
      "name": "The Fools Leap",
      "position": {
        "x": 58,
        "y": 29
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "North end of Oldtown's western venue chain.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-foggers-mill",
      "type": "stage",
      "name": "Foggers Mill",
      "position": {
        "x": 68,
        "y": 25
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Hilltop clearing route east of Full Moon Ballroom.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-hangar-161",
      "type": "stage",
      "name": "Hangar 161",
      "position": {
        "x": 30,
        "y": 43
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Area 404 stage west of the eastbound venue chain.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-tribe-of-frog",
      "type": "stage",
      "name": "Tribe of Frog",
      "position": {
        "x": 64,
        "y": 44
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Wooded clearing south of Oldtown.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-sibin-beag",
      "type": "stage",
      "name": "Síbín Beag",
      "position": {
        "x": 72,
        "y": 41
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Eastern Oldtown venue chain, above The Feckless Wrecked.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-acid-leak",
      "type": "stage",
      "name": "Acid Leak",
      "position": {
        "x": 34,
        "y": 44
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Area 404 acid-techno cluster.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "stage-infinity",
      "type": "stage",
      "name": "Infinity",
      "position": {
        "x": 41,
        "y": 42
      },
      "dimensions": {
        "width": 3,
        "height": 3
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "East of the Metropolis venue chain.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map relationship audited."
      }
    },
    {
      "id": "entrance-west-gate",
      "type": "entrance",
      "name": "West Gate",
      "position": {
        "x": 3,
        "y": 46
      },
      "dimensions": {
        "width": 2,
        "height": 2
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Main entrance — shuttle buses, taxi rank and coach drop-off land here. Nearest to West, Downtown and Meadow (accessible) camping, the Public Transport Hub and Camp Orchid Downtown pitches.",
        "category": "entrance",
        "accessibility": "",
        "notes": "Approximate schematic position. Migrated from the verified legacy gate collection.",
        "hours": "Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30."
      }
    },
    {
      "id": "entrance-east-gate",
      "type": "entrance",
      "name": "East Gate",
      "position": {
        "x": 96,
        "y": 32
      },
      "dimensions": {
        "width": 2,
        "height": 2
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Nearest the White Carparks, motorcycle and cycle parking, and Campervan Field.",
        "category": "entrance",
        "accessibility": "",
        "notes": "Approximate schematic position. Migrated from the verified legacy gate collection.",
        "hours": "Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30."
      }
    },
    {
      "id": "entrance-south-gate",
      "type": "entrance",
      "name": "South Gate",
      "position": {
        "x": 78,
        "y": 79
      },
      "dimensions": {
        "width": 2,
        "height": 2
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Nearest White Carpark 4 and Camp Skylark Sunset; the other Camp Skylark premium site sits on Hilltop.",
        "category": "entrance",
        "accessibility": "",
        "notes": "Approximate schematic position. Migrated from the verified legacy gate collection.",
        "hours": "Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30."
      }
    },
    {
      "id": "entrance-campervan-gate",
      "type": "entrance",
      "name": "Campervan Gate",
      "position": {
        "x": 80,
        "y": 81
      },
      "dimensions": {
        "width": 2,
        "height": 2
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "A separately labelled entrance beside South Gate, serving the Campervan Field.",
        "category": "entrance",
        "accessibility": "",
        "notes": "Seen in a whole-map reference screenshot. Migrated from the verified legacy gate collection.",
        "hours": "Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30."
      }
    },
    {
      "id": "amenity-toilets-west-gate-1",
      "type": "toilet",
      "name": "Toilets — West Gate",
      "position": {
        "x": 4,
        "y": 44
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "West Gate",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 0
      }
    },
    {
      "id": "amenity-toilets-west-gate-2",
      "type": "toilet",
      "name": "Toilets — West Gate",
      "position": {
        "x": 5,
        "y": 48
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "West Gate",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 1
      }
    },
    {
      "id": "amenity-toilets-metropolis-path-1",
      "type": "toilet",
      "name": "Toilets — Metropolis path",
      "position": {
        "x": 9,
        "y": 35
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis path",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 2
      }
    },
    {
      "id": "amenity-toilets-metropolis-path-2",
      "type": "toilet",
      "name": "Toilets — Metropolis path",
      "position": {
        "x": 11,
        "y": 38
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis path",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 3
      }
    },
    {
      "id": "amenity-toilets-metropolis-path-3",
      "type": "toilet",
      "name": "Toilets — Metropolis path",
      "position": {
        "x": 13,
        "y": 41
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis path",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 4
      }
    },
    {
      "id": "amenity-water-point-metropolis-path-1",
      "type": "decoration",
      "name": "Water Point — Metropolis path",
      "position": {
        "x": 12,
        "y": 39
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis path",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 5
      }
    },
    {
      "id": "amenity-welfare-metropolis-1",
      "type": "decoration",
      "name": "Welfare — Metropolis",
      "position": {
        "x": 16,
        "y": 31
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis",
        "category": "Welfare",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 6
      }
    },
    {
      "id": "amenity-food-metropolis-1",
      "type": "vendor",
      "name": "Food — Metropolis",
      "position": {
        "x": 18,
        "y": 33
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 7
      }
    },
    {
      "id": "amenity-bar-metropolis-1",
      "type": "vendor",
      "name": "Bar — Metropolis",
      "position": {
        "x": 19,
        "y": 30
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Metropolis",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 8
      }
    },
    {
      "id": "amenity-top-up-point-ancient-futures-1",
      "type": "decoration",
      "name": "Top-Up Point — Ancient Futures",
      "position": {
        "x": 58,
        "y": 36
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Ancient Futures",
        "category": "Top-Up Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 9
      }
    },
    {
      "id": "amenity-photobooth-ancient-futures-1",
      "type": "decoration",
      "name": "Photobooth — Ancient Futures",
      "position": {
        "x": 57,
        "y": 38
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Ancient Futures",
        "category": "Photobooth",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 10
      }
    },
    {
      "id": "amenity-food-ancient-futures-1",
      "type": "vendor",
      "name": "Food — Ancient Futures",
      "position": {
        "x": 60,
        "y": 39
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Ancient Futures",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 11
      }
    },
    {
      "id": "amenity-food-ancient-futures-2",
      "type": "vendor",
      "name": "Food — Ancient Futures",
      "position": {
        "x": 61,
        "y": 41
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Ancient Futures",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 12
      }
    },
    {
      "id": "amenity-welfare-ancient-futures-1",
      "type": "decoration",
      "name": "Welfare — Ancient Futures",
      "position": {
        "x": 59,
        "y": 43
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Ancient Futures",
        "category": "Welfare",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 13
      }
    },
    {
      "id": "amenity-first-aid-ancient-futures-1",
      "type": "medical",
      "name": "First Aid — Ancient Futures",
      "position": {
        "x": 60,
        "y": 45
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Ancient Futures",
        "category": "First Aid",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 14
      }
    },
    {
      "id": "amenity-toilets-oldtown-the-fools-leap-1",
      "type": "toilet",
      "name": "Toilets — Oldtown / The Fools Leap",
      "position": {
        "x": 67,
        "y": 39
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown / The Fools Leap",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 15
      }
    },
    {
      "id": "amenity-accessible-facilities-oldtown-the-fools-leap-1",
      "type": "decoration",
      "name": "Accessible Facilities — Oldtown / The Fools Leap",
      "position": {
        "x": 68,
        "y": 40
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown / The Fools Leap",
        "category": "Accessible Facilities",
        "accessibility": "accessible",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 16
      }
    },
    {
      "id": "amenity-water-point-oldtown-the-fools-leap-1",
      "type": "decoration",
      "name": "Water Point — Oldtown / The Fools Leap",
      "position": {
        "x": 69,
        "y": 41
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown / The Fools Leap",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 17
      }
    },
    {
      "id": "amenity-market-pepperpot-market-1",
      "type": "vendor",
      "name": "Market — Pepperpot Market",
      "position": {
        "x": 45,
        "y": 49
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Market",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 18
      }
    },
    {
      "id": "amenity-food-pepperpot-market-1",
      "type": "vendor",
      "name": "Food — Pepperpot Market",
      "position": {
        "x": 47,
        "y": 51
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 19
      }
    },
    {
      "id": "amenity-food-pepperpot-market-2",
      "type": "vendor",
      "name": "Food — Pepperpot Market",
      "position": {
        "x": 44,
        "y": 52
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 20
      }
    },
    {
      "id": "amenity-bar-pepperpot-market-1",
      "type": "vendor",
      "name": "Bar — Pepperpot Market",
      "position": {
        "x": 48,
        "y": 48
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 21
      }
    },
    {
      "id": "amenity-reception-pepperpot-market-1",
      "type": "decoration",
      "name": "Reception — Pepperpot Market",
      "position": {
        "x": 46,
        "y": 52
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Reception",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 22
      }
    },
    {
      "id": "amenity-first-aid-pepperpot-market-1",
      "type": "medical",
      "name": "First Aid — Pepperpot Market",
      "position": {
        "x": 49,
        "y": 50
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "First Aid",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 23
      }
    },
    {
      "id": "amenity-welfare-pepperpot-market-1",
      "type": "decoration",
      "name": "Welfare — Pepperpot Market",
      "position": {
        "x": 43,
        "y": 50
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Welfare",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 24
      }
    },
    {
      "id": "amenity-cash-point-pepperpot-market-1",
      "type": "decoration",
      "name": "Cash Point — Pepperpot Market",
      "position": {
        "x": 46,
        "y": 47
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Pepperpot Market",
        "category": "Cash Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 25
      }
    },
    {
      "id": "amenity-toilets-grand-central-1",
      "type": "toilet",
      "name": "Toilets — Grand Central",
      "position": {
        "x": 58,
        "y": 20
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 26
      }
    },
    {
      "id": "amenity-toilets-grand-central-2",
      "type": "toilet",
      "name": "Toilets — Grand Central",
      "position": {
        "x": 62,
        "y": 23
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 27
      }
    },
    {
      "id": "amenity-food-grand-central-1",
      "type": "vendor",
      "name": "Food — Grand Central",
      "position": {
        "x": 59,
        "y": 25
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 28
      }
    },
    {
      "id": "amenity-welfare-grand-central-1",
      "type": "decoration",
      "name": "Welfare — Grand Central",
      "position": {
        "x": 56,
        "y": 26
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Welfare",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 29
      }
    },
    {
      "id": "amenity-water-point-grand-central-1",
      "type": "decoration",
      "name": "Water Point — Grand Central",
      "position": {
        "x": 63,
        "y": 21
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 30
      }
    },
    {
      "id": "amenity-toilets-west-camping-alresford-rd-1",
      "type": "toilet",
      "name": "Toilets — West Camping / Alresford Rd",
      "position": {
        "x": 13,
        "y": 5
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "West Camping / Alresford Rd",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 31
      }
    },
    {
      "id": "amenity-accessible-facilities-west-camping-alresford-rd-1",
      "type": "decoration",
      "name": "Accessible Facilities — West Camping / Alresford Rd",
      "position": {
        "x": 14,
        "y": 6
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "West Camping / Alresford Rd",
        "category": "Accessible Facilities",
        "accessibility": "accessible",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 32
      }
    },
    {
      "id": "amenity-skylark-entry-camp-skylark-hilltop-1",
      "type": "decoration",
      "name": "Skylark Entry — Camp Skylark Hilltop",
      "position": {
        "x": 76,
        "y": 21
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Camp Skylark Hilltop",
        "category": "Skylark Entry",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 33
      }
    },
    {
      "id": "amenity-skylark-entry-camp-skylark-sunset-1",
      "type": "decoration",
      "name": "Skylark Entry — Camp Skylark Sunset",
      "position": {
        "x": 75,
        "y": 70
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Camp Skylark Sunset",
        "category": "Skylark Entry",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 34
      }
    },
    {
      "id": "amenity-toilets-south-gate-1",
      "type": "toilet",
      "name": "Toilets — South Gate",
      "position": {
        "x": 77,
        "y": 76
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "South Gate",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 35
      }
    },
    {
      "id": "amenity-toilets-south-gate-2",
      "type": "toilet",
      "name": "Toilets — South Gate",
      "position": {
        "x": 79,
        "y": 77
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "South Gate",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 36
      }
    },
    {
      "id": "amenity-accessible-facilities-south-gate-1",
      "type": "decoration",
      "name": "Accessible Facilities — South Gate",
      "position": {
        "x": 78,
        "y": 78
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "South Gate",
        "category": "Accessible Facilities",
        "accessibility": "accessible",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 37
      }
    },
    {
      "id": "amenity-water-point-south-gate-1",
      "type": "decoration",
      "name": "Water Point — South Gate",
      "position": {
        "x": 76,
        "y": 75
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "South Gate",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 38
      }
    },
    {
      "id": "amenity-welfare-camp-skylark-sunset-1",
      "type": "decoration",
      "name": "Welfare — Camp Skylark Sunset",
      "position": {
        "x": 73,
        "y": 71
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Camp Skylark Sunset",
        "category": "Welfare",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 39
      }
    },
    {
      "id": "amenity-toilets-quiet-camping-1",
      "type": "toilet",
      "name": "Toilets — Quiet Camping",
      "position": {
        "x": 93,
        "y": 61
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Quiet Camping",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 40
      }
    },
    {
      "id": "amenity-toilets-quiet-camping-2",
      "type": "toilet",
      "name": "Toilets — Quiet Camping",
      "position": {
        "x": 96,
        "y": 62
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Quiet Camping",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 41
      }
    },
    {
      "id": "amenity-water-point-quiet-camping-1",
      "type": "decoration",
      "name": "Water Point — Quiet Camping",
      "position": {
        "x": 94,
        "y": 66
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Quiet Camping",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 42
      }
    },
    {
      "id": "amenity-toilets-tangerine-fields-1",
      "type": "toilet",
      "name": "Toilets — Tangerine Fields",
      "position": {
        "x": 68,
        "y": 4
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Tangerine Fields",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 43
      }
    },
    {
      "id": "amenity-water-point-tangerine-fields-1",
      "type": "decoration",
      "name": "Water Point — Tangerine Fields",
      "position": {
        "x": 72,
        "y": 8
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Tangerine Fields",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 44
      }
    },
    {
      "id": "amenity-accessible-facilities-downtown-camping-path-1",
      "type": "decoration",
      "name": "Accessible Facilities — Downtown Camping path",
      "position": {
        "x": 11,
        "y": 24
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Downtown Camping path",
        "category": "Accessible Facilities",
        "accessibility": "accessible",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 45
      }
    },
    {
      "id": "amenity-photobooth-downtown-camping-path-1",
      "type": "decoration",
      "name": "Photobooth — Downtown Camping path",
      "position": {
        "x": 11,
        "y": 26
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Downtown Camping path",
        "category": "Photobooth",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 46
      }
    },
    {
      "id": "amenity-food-downtown-camping-path-1",
      "type": "vendor",
      "name": "Food — Downtown Camping path",
      "position": {
        "x": 12,
        "y": 30
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Downtown Camping path",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 47
      }
    },
    {
      "id": "amenity-toilets-downtown-camping-path-1",
      "type": "toilet",
      "name": "Toilets — Downtown Camping path",
      "position": {
        "x": 13,
        "y": 32
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Downtown Camping path",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 48
      }
    },
    {
      "id": "amenity-food-hidden-woods-1",
      "type": "vendor",
      "name": "Food — Hidden Woods",
      "position": {
        "x": 16,
        "y": 3
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Hidden Woods",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 49
      }
    },
    {
      "id": "amenity-food-hidden-woods-2",
      "type": "vendor",
      "name": "Food — Hidden Woods",
      "position": {
        "x": 17,
        "y": 6
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Hidden Woods",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 50
      }
    },
    {
      "id": "amenity-food-hidden-woods-3",
      "type": "vendor",
      "name": "Food — Hidden Woods",
      "position": {
        "x": 18,
        "y": 10
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Hidden Woods",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 51
      }
    },
    {
      "id": "amenity-bar-letsbe-avenue-1",
      "type": "vendor",
      "name": "Bar — Letsbe Avenue",
      "position": {
        "x": 39,
        "y": 8
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Letsbe Avenue",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 52
      }
    },
    {
      "id": "amenity-bar-letsbe-avenue-2",
      "type": "vendor",
      "name": "Bar — Letsbe Avenue",
      "position": {
        "x": 40,
        "y": 10
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Letsbe Avenue",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 53
      }
    },
    {
      "id": "amenity-food-botanica-1",
      "type": "vendor",
      "name": "Food — Botanica",
      "position": {
        "x": 30,
        "y": 18
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Botanica",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 54
      }
    },
    {
      "id": "amenity-toilets-nexus-1",
      "type": "toilet",
      "name": "Toilets — NEXUS",
      "position": {
        "x": 21,
        "y": 24
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "NEXUS",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 55
      }
    },
    {
      "id": "amenity-accessible-facilities-nexus-1",
      "type": "decoration",
      "name": "Accessible Facilities — NEXUS",
      "position": {
        "x": 22,
        "y": 25
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "NEXUS",
        "category": "Accessible Facilities",
        "accessibility": "accessible",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 56
      }
    },
    {
      "id": "amenity-water-point-nexus-1",
      "type": "decoration",
      "name": "Water Point — NEXUS",
      "position": {
        "x": 21,
        "y": 25
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "NEXUS",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 57
      }
    },
    {
      "id": "amenity-bar-nexus-1",
      "type": "vendor",
      "name": "Bar — NEXUS",
      "position": {
        "x": 25,
        "y": 21
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "NEXUS",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 58
      }
    },
    {
      "id": "amenity-food-botanica-2",
      "type": "vendor",
      "name": "Food — Botanica",
      "position": {
        "x": 34,
        "y": 30
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Botanica",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 59
      }
    },
    {
      "id": "amenity-toilets-botanica-area-404-path-1",
      "type": "toilet",
      "name": "Toilets — Botanica / Area 404 path",
      "position": {
        "x": 40,
        "y": 23
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Botanica / Area 404 path",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 60
      }
    },
    {
      "id": "amenity-water-point-botanica-area-404-path-1",
      "type": "decoration",
      "name": "Water Point — Botanica / Area 404 path",
      "position": {
        "x": 41,
        "y": 24
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Botanica / Area 404 path",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 61
      }
    },
    {
      "id": "amenity-food-botanica-area-404-path-1",
      "type": "vendor",
      "name": "Food — Botanica / Area 404 path",
      "position": {
        "x": 42,
        "y": 25
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Botanica / Area 404 path",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 62
      }
    },
    {
      "id": "amenity-bar-botanica-area-404-path-1",
      "type": "vendor",
      "name": "Bar — Botanica / Area 404 path",
      "position": {
        "x": 37,
        "y": 28
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Botanica / Area 404 path",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 63
      }
    },
    {
      "id": "amenity-bar-tangled-roots-path-1",
      "type": "vendor",
      "name": "Bar — Tangled Roots path",
      "position": {
        "x": 57,
        "y": 19
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Tangled Roots path",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 64
      }
    },
    {
      "id": "amenity-bar-tangled-roots-path-2",
      "type": "vendor",
      "name": "Bar — Tangled Roots path",
      "position": {
        "x": 58,
        "y": 21
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Tangled Roots path",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 65
      }
    },
    {
      "id": "amenity-bar-grand-central-1",
      "type": "vendor",
      "name": "Bar — Grand Central",
      "position": {
        "x": 63,
        "y": 31
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 66
      }
    },
    {
      "id": "amenity-bar-grand-central-2",
      "type": "vendor",
      "name": "Bar — Grand Central",
      "position": {
        "x": 67,
        "y": 32
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 67
      }
    },
    {
      "id": "amenity-food-grand-central-2",
      "type": "vendor",
      "name": "Food — Grand Central",
      "position": {
        "x": 65,
        "y": 33
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 68
      }
    },
    {
      "id": "amenity-cash-point-grand-central-1",
      "type": "decoration",
      "name": "Cash Point — Grand Central",
      "position": {
        "x": 64,
        "y": 29
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Grand Central",
        "category": "Cash Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 69
      }
    },
    {
      "id": "amenity-bar-oldtown-north-1",
      "type": "vendor",
      "name": "Bar — Oldtown (north)",
      "position": {
        "x": 60,
        "y": 31
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown (north)",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 70
      }
    },
    {
      "id": "amenity-photobooth-oldtown-north-1",
      "type": "decoration",
      "name": "Photobooth — Oldtown (north)",
      "position": {
        "x": 61,
        "y": 32
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown (north)",
        "category": "Photobooth",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 71
      }
    },
    {
      "id": "amenity-water-point-oldtown-north-1",
      "type": "decoration",
      "name": "Water Point — Oldtown (north)",
      "position": {
        "x": 62,
        "y": 33
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown (north)",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 72
      }
    },
    {
      "id": "amenity-first-aid-oldtown-north-1",
      "type": "medical",
      "name": "First Aid — Oldtown (north)",
      "position": {
        "x": 72,
        "y": 30
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Oldtown (north)",
        "category": "First Aid",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 73
      }
    },
    {
      "id": "amenity-toilets-quantum-1",
      "type": "toilet",
      "name": "Toilets — Quantum",
      "position": {
        "x": 74,
        "y": 51
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Quantum",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 74
      }
    },
    {
      "id": "amenity-photobooth-the-lion-s-den-1",
      "type": "decoration",
      "name": "Photobooth — The Lion's Den",
      "position": {
        "x": 82,
        "y": 54
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "The Lion's Den",
        "category": "Photobooth",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 75
      }
    },
    {
      "id": "amenity-bar-the-lion-s-den-1",
      "type": "vendor",
      "name": "Bar — The Lion's Den",
      "position": {
        "x": 82,
        "y": 55
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "The Lion's Den",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 76
      }
    },
    {
      "id": "amenity-toilets-the-lion-s-den-1",
      "type": "toilet",
      "name": "Toilets — The Lion's Den",
      "position": {
        "x": 85,
        "y": 56
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "The Lion's Den",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 77
      }
    },
    {
      "id": "amenity-water-point-the-lion-s-den-1",
      "type": "decoration",
      "name": "Water Point — The Lion's Den",
      "position": {
        "x": 86,
        "y": 57
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "The Lion's Den",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 78
      }
    },
    {
      "id": "amenity-toilets-anara-forest-1",
      "type": "toilet",
      "name": "Toilets — Anara Forest",
      "position": {
        "x": 84,
        "y": 23
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Anara Forest",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 79
      }
    },
    {
      "id": "amenity-accessible-facilities-anara-forest-1",
      "type": "decoration",
      "name": "Accessible Facilities — Anara Forest",
      "position": {
        "x": 86,
        "y": 21
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Anara Forest",
        "category": "Accessible Facilities",
        "accessibility": "accessible",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 80
      }
    },
    {
      "id": "amenity-water-point-anara-forest-1",
      "type": "decoration",
      "name": "Water Point — Anara Forest",
      "position": {
        "x": 87,
        "y": 23
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Anara Forest",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 81
      }
    },
    {
      "id": "amenity-toilets-temple-valley-camping-1",
      "type": "toilet",
      "name": "Toilets — Temple Valley Camping",
      "position": {
        "x": 84,
        "y": 30
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Temple Valley Camping",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 82
      }
    },
    {
      "id": "amenity-water-point-temple-valley-camping-1",
      "type": "decoration",
      "name": "Water Point — Temple Valley Camping",
      "position": {
        "x": 87,
        "y": 33
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Temple Valley Camping",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 83
      }
    },
    {
      "id": "amenity-toilets-east-camping-1",
      "type": "toilet",
      "name": "Toilets — East Camping",
      "position": {
        "x": 90,
        "y": 46
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "East Camping",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 84
      }
    },
    {
      "id": "amenity-water-point-east-camping-1",
      "type": "decoration",
      "name": "Water Point — East Camping",
      "position": {
        "x": 93,
        "y": 49
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "East Camping",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 85
      }
    },
    {
      "id": "amenity-toilets-sunset-hill-1",
      "type": "toilet",
      "name": "Toilets — Sunset Hill",
      "position": {
        "x": 78,
        "y": 63
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Sunset Hill",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 86
      }
    },
    {
      "id": "amenity-water-point-sunset-hill-1",
      "type": "decoration",
      "name": "Water Point — Sunset Hill",
      "position": {
        "x": 76,
        "y": 65
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Sunset Hill",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 87
      }
    },
    {
      "id": "amenity-toilets-sunset-hill-camp-skylark-sunset-approach-1",
      "type": "toilet",
      "name": "Toilets — Sunset Hill / Camp Skylark Sunset approach",
      "position": {
        "x": 74,
        "y": 68
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Sunset Hill / Camp Skylark Sunset approach",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 88
      }
    },
    {
      "id": "amenity-food-camp-skylark-sunset-1",
      "type": "vendor",
      "name": "Food — Camp Skylark Sunset",
      "position": {
        "x": 72,
        "y": 73
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Camp Skylark Sunset",
        "category": "Food",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 89
      }
    },
    {
      "id": "amenity-toilets-camp-skylark-sunset-1",
      "type": "toilet",
      "name": "Toilets — Camp Skylark Sunset",
      "position": {
        "x": 77,
        "y": 73
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Camp Skylark Sunset",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 90
      }
    },
    {
      "id": "amenity-toilets-hydro-xl-1",
      "type": "toilet",
      "name": "Toilets — Hydro XL",
      "position": {
        "x": 7,
        "y": 48
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Hydro XL",
        "category": "Toilets",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 91
      }
    },
    {
      "id": "amenity-water-point-hydro-xl-1",
      "type": "decoration",
      "name": "Water Point — Hydro XL",
      "position": {
        "x": 11,
        "y": 49
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Hydro XL",
        "category": "Water Point",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 92
      }
    },
    {
      "id": "amenity-bar-hydro-xl-1",
      "type": "vendor",
      "name": "Bar — Hydro XL",
      "position": {
        "x": 9,
        "y": 43
      },
      "dimensions": {
        "width": 1.25,
        "height": 1.25
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "amenities",
      "asset": null,
      "metadata": {
        "description": "Hydro XL",
        "category": "Bar",
        "accessibility": "",
        "notes": "Migrated from the legacy hand-placed, video-referenced amenities collection.",
        "mapRole": "amenity",
        "legacyIndex": 93
      }
    }
  ]
};
window.GREEBTOWN_CAMP_ZONES = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "schematic-percent-v1",
  "zones": [
    {
      "id": "camp-west",
      "name": "West Camping",
      "position": {
        "x": 14,
        "y": 7
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "North-west field beside West Gate."
    },
    {
      "id": "camp-downtown",
      "name": "Downtown Camping",
      "position": {
        "x": 7,
        "y": 43
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "West-side camping in the reviewed gap between Meadow fields and the Downtown cluster, separate from Camp Orchid."
    },
    {
      "id": "camp-meadow-accessible",
      "name": "Meadow Camping (Accessible)",
      "position": {
        "x": 7,
        "y": 58
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Accessible meadow field."
    },
    {
      "id": "camp-meadow-living",
      "name": "Meadow Living",
      "position": {
        "x": 10,
        "y": 58
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Adjacent field, deliberately distinct from accessible camping."
    },
    {
      "id": "camp-valley",
      "name": "Valley Camping",
      "position": {
        "x": 48,
        "y": 4
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Northern valley field."
    },
    {
      "id": "camp-tangerine",
      "name": "Tangerine Fields",
      "position": {
        "x": 70,
        "y": 6
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Northern field east of Valley Camping."
    },
    {
      "id": "camp-campervan",
      "name": "Campervan Field",
      "position": {
        "x": 86,
        "y": 14
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "East-side vehicle field."
    },
    {
      "id": "camp-temple-valley",
      "name": "Temple Valley Camping",
      "position": {
        "x": 95,
        "y": 18
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Long east-side camping field near East Gate."
    },
    {
      "id": "camp-east",
      "name": "East Camping",
      "position": {
        "x": 91,
        "y": 48
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "East-side field south of Temple Valley."
    },
    {
      "id": "camp-quiet",
      "name": "Quiet Camping",
      "position": {
        "x": 95,
        "y": 64
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "South-east quieter field."
    },
    {
      "id": "camp-orchid-downtown",
      "name": "Camp Orchid Downtown",
      "position": {
        "x": 10,
        "y": 46
      },
      "surface": "camp-premium",
      "evidence": "official-overview",
      "notes": "Premium public-transport camp; distinct pink field on the west side of the reviewed Downtown cluster."
    },
    {
      "id": "camp-skylark-hilltop",
      "name": "Camp Skylark Hilltop",
      "position": {
        "x": 75,
        "y": 22
      },
      "surface": "camp-premium",
      "evidence": "official-overview",
      "notes": "Premium Hilltop camp."
    },
    {
      "id": "camp-skylark-sunset",
      "name": "Camp Skylark Sunset",
      "position": {
        "x": 74,
        "y": 72
      },
      "surface": "camp-premium",
      "evidence": "official-overview",
      "notes": "Premium south-side camp near Sunset Hill."
    },
    {
      "id": "camp-camplight",
      "name": "Camplight",
      "position": {
        "x": 5,
        "y": 45
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Separate labelled field next to Downtown Camping and Orchid in the reviewed west-side cluster."
    }
  ]
};
window.GREEBTOWN_EVIDENCED_PATHS = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "schematic-percent-v1",
  "paths": [
    {
      "id": "path-west-gate-downtown",
      "from": "West Gate",
      "to": "Downtown Camping",
      "evidence": "official-overview",
      "points": [
        [
          3,
          46
        ],
        [
          4,
          45
        ],
        [
          6,
          44
        ],
        [
          7,
          43
        ]
      ]
    },
    {
      "id": "path-downtown-metropolis",
      "from": "Downtown Camping",
      "to": "Metropolis",
      "evidence": "official-overview",
      "points": [
        [
          5,
          35
        ],
        [
          8,
          34
        ],
        [
          11,
          35
        ],
        [
          15,
          36
        ]
      ]
    },
    {
      "id": "path-grand-central-oldtown",
      "from": "Grand Central",
      "to": "Oldtown",
      "evidence": "official-detail",
      "points": [
        [
          72,
          30
        ],
        [
          71,
          34
        ],
        [
          69,
          37
        ],
        [
          68,
          40
        ]
      ]
    },
    {
      "id": "path-oldtown-quantum",
      "from": "Oldtown",
      "to": "Quantum",
      "evidence": "official-detail",
      "points": [
        [
          68,
          40
        ],
        [
          69,
          44
        ],
        [
          71,
          47
        ],
        [
          73,
          50
        ]
      ]
    },
    {
      "id": "path-quantum-helix",
      "from": "Quantum",
      "to": "Helix",
      "evidence": "official-detail",
      "points": [
        [
          73,
          50
        ],
        [
          75,
          51
        ],
        [
          78,
          52
        ]
      ]
    },
    {
      "id": "path-helix-lion",
      "from": "Helix",
      "to": "The Lion's Den",
      "evidence": "official-detail",
      "points": [
        [
          78,
          52
        ],
        [
          80,
          55
        ],
        [
          83,
          55
        ]
      ]
    },
    {
      "id": "path-botanica-metropolis",
      "from": "Botanica",
      "to": "Metropolis",
      "evidence": "official-overview",
      "points": [
        [
          28,
          18
        ],
        [
          23,
          22
        ],
        [
          18,
          29
        ],
        [
          15,
          36
        ]
      ]
    },
    {
      "id": "path-botanica-letsbe",
      "from": "Botanica",
      "to": "Letsbe Avenue",
      "evidence": "official-detail",
      "points": [
        [
          28,
          18
        ],
        [
          31,
          16
        ],
        [
          35,
          13
        ],
        [
          40,
          9
        ]
      ]
    },
    {
      "id": "path-letsbe-luck",
      "from": "Letsbe Avenue",
      "to": "Luck Exchange Casino",
      "evidence": "official-detail",
      "points": [
        [
          40,
          9
        ],
        [
          39,
          10
        ],
        [
          37,
          12
        ]
      ]
    },
    {
      "id": "path-luck-hotel",
      "from": "Luck Exchange Casino",
      "to": "Hotel Paradiso",
      "evidence": "official-detail",
      "points": [
        [
          37,
          12
        ],
        [
          34,
          13
        ],
        [
          30,
          15
        ]
      ]
    },
    {
      "id": "path-hotel-postal",
      "from": "Hotel Paradiso",
      "to": "Postal Posse",
      "evidence": "official-detail",
      "points": [
        [
          30,
          15
        ],
        [
          31,
          17
        ],
        [
          32,
          19
        ]
      ]
    },
    {
      "id": "path-postal-botanica",
      "from": "Postal Posse",
      "to": "Botanica",
      "evidence": "official-detail",
      "points": [
        [
          32,
          19
        ],
        [
          30,
          19
        ],
        [
          28,
          18
        ]
      ]
    },
    {
      "id": "path-metropolis-enumbers",
      "from": "Metropolis",
      "to": "E Numbers",
      "evidence": "official-detail",
      "points": [
        [
          15,
          36
        ],
        [
          17,
          37
        ],
        [
          19,
          38
        ]
      ]
    },
    {
      "id": "path-enumbers-gabber",
      "from": "E Numbers",
      "to": "Gabber Kebabber",
      "evidence": "official-detail",
      "points": [
        [
          19,
          38
        ],
        [
          21,
          39
        ],
        [
          22,
          40
        ]
      ]
    },
    {
      "id": "path-gabber-infinity",
      "from": "Gabber Kebabber",
      "to": "Infinity",
      "evidence": "official-detail",
      "points": [
        [
          22,
          40
        ],
        [
          31,
          41
        ],
        [
          41,
          42
        ]
      ]
    },
    {
      "id": "path-area-spectrum",
      "from": "Area 404",
      "to": "Spectrum 360",
      "evidence": "official-detail",
      "points": [
        [
          36,
          37
        ],
        [
          36,
          35
        ],
        [
          37,
          32
        ]
      ]
    },
    {
      "id": "path-spectrum-hangar",
      "from": "Spectrum 360",
      "to": "Hangar 161",
      "evidence": "official-detail",
      "points": [
        [
          37,
          32
        ],
        [
          34,
          36
        ],
        [
          30,
          43
        ]
      ]
    },
    {
      "id": "path-hangar-deviant",
      "from": "Hangar 161",
      "to": "Deviant Lounge",
      "evidence": "official-detail",
      "points": [
        [
          30,
          43
        ],
        [
          32,
          44
        ],
        [
          34,
          45
        ]
      ]
    },
    {
      "id": "path-oldtown-pomegranate",
      "from": "Oldtown",
      "to": "The Pomegranate Parlour",
      "evidence": "official-detail",
      "points": [
        [
          68,
          40
        ],
        [
          67,
          36
        ],
        [
          66,
          33
        ]
      ]
    },
    {
      "id": "path-pomegranate-den",
      "from": "The Pomegranate Parlour",
      "to": "Den of Dis Order",
      "evidence": "official-detail",
      "points": [
        [
          66,
          33
        ],
        [
          65,
          34
        ],
        [
          64,
          35
        ]
      ]
    },
    {
      "id": "path-den-mining",
      "from": "Den of Dis Order",
      "to": "Mining for (g)Old Town",
      "evidence": "official-detail",
      "points": [
        [
          64,
          35
        ],
        [
          64,
          36
        ]
      ]
    },
    {
      "id": "path-mining-sibin",
      "from": "Mining for (g)Old Town",
      "to": "Síbín Beag",
      "evidence": "official-detail",
      "points": [
        [
          64,
          36
        ],
        [
          68,
          38
        ],
        [
          72,
          41
        ]
      ]
    },
    {
      "id": "path-sibin-feckless",
      "from": "Síbín Beag",
      "to": "The Feckless Wrecked",
      "evidence": "official-detail",
      "points": [
        [
          72,
          41
        ],
        [
          73,
          42
        ],
        [
          74,
          43
        ]
      ]
    }
  ]
};
window.GREEBTOWN_DISTRICT_FOOTPRINTS = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "schematic-percent-v1",
  "footprints": [
    {
      "id": "district-metropolis",
      "name": "Metropolis",
      "evidence": "official-overview",
      "points": [
        [
          8,
          50
        ],
        [
          16,
          46
        ],
        [
          27,
          48
        ],
        [
          33,
          54
        ],
        [
          32,
          63
        ],
        [
          25,
          69
        ],
        [
          13,
          68
        ],
        [
          7,
          62
        ]
      ]
    },
    {
      "id": "district-botanica",
      "name": "Botanica",
      "evidence": "official-overview",
      "points": [
        [
          20,
          34
        ],
        [
          31,
          31
        ],
        [
          40,
          34
        ],
        [
          44,
          42
        ],
        [
          39,
          51
        ],
        [
          31,
          55
        ],
        [
          22,
          52
        ],
        [
          17,
          44
        ]
      ]
    },
    {
      "id": "district-area-404",
      "name": "Area 404",
      "evidence": "official-overview",
      "points": [
        [
          30,
          53
        ],
        [
          43,
          52
        ],
        [
          52,
          58
        ],
        [
          55,
          67
        ],
        [
          50,
          75
        ],
        [
          39,
          78
        ],
        [
          29,
          73
        ],
        [
          26,
          63
        ]
      ]
    },
    {
      "id": "district-letsbe-avenue",
      "name": "Letsbe Avenue",
      "evidence": "official-detail",
      "points": [
        [
          28,
          25
        ],
        [
          41,
          24
        ],
        [
          49,
          29
        ],
        [
          50,
          35
        ],
        [
          45,
          40
        ],
        [
          35,
          40
        ],
        [
          27,
          36
        ]
      ]
    },
    {
      "id": "district-oldtown",
      "name": "Oldtown",
      "evidence": "official-detail",
      "points": [
        [
          55,
          42
        ],
        [
          64,
          40
        ],
        [
          71,
          46
        ],
        [
          73,
          54
        ],
        [
          69,
          61
        ],
        [
          62,
          64
        ],
        [
          54,
          59
        ],
        [
          51,
          50
        ]
      ]
    }
  ]
};
window.GREEBTOWN_REFERENCE_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "schematic-percent-v1",
  "reviewedOverview": true,
  "reviewNote": "Anchors re-derived as one full-site composition from the user-supplied official overview references.",
  "anchors": {
    "Botanica": {
      "from": [
        28,
        18
      ],
      "to": [
        30,
        42
      ]
    },
    "Metropolis": {
      "from": [
        15,
        36
      ],
      "to": [
        20,
        57
      ]
    },
    "Area 404": {
      "from": [
        36,
        37
      ],
      "to": [
        41,
        60
      ]
    },
    "Letsbe Avenue": {
      "from": [
        40,
        9
      ],
      "to": [
        38,
        31
      ]
    },
    "Grand Central": {
      "from": [
        72,
        30
      ],
      "to": [
        61,
        40
      ]
    },
    "Oldtown": {
      "from": [
        68,
        40
      ],
      "to": [
        62,
        54
      ]
    },
    "Hydro XL": {
      "from": [
        11,
        46
      ],
      "to": [
        15,
        67
      ]
    },
    "Anara Forest": {
      "from": [
        85,
        22
      ],
      "to": [
        82,
        35
      ]
    },
    "The Lion's Den": {
      "from": [
        83,
        55
      ],
      "to": [
        78,
        70
      ]
    },
    "Helix": {
      "from": [
        78,
        52
      ],
      "to": [
        73,
        64
      ]
    },
    "Hidden Woods": {
      "from": [
        18,
        2
      ],
      "to": [
        18,
        26
      ]
    }
  },
  "members": {
    "NEXUS": "Botanica",
    "Rose and Clown": "Botanica",
    "Spectrum 360": "Area 404",
    "Hangar 161": "Area 404",
    "Acid Leak": "Area 404",
    "Infinity": "Area 404",
    "The Fools Leap": "Oldtown",
    "Tribe of Frog": "Oldtown",
    "Síbín Beag": "Oldtown",
    "Tangled Roots": "Grand Central",
    "Full Moon Ballroom": "Grand Central",
    "Foggers Mill": "Grand Central"
  }
};
window.GREEBTOWN_SMALL_VENUE_LAYOUT = {
  "schemaVersion": "1.0.0",
  "purpose": "Reviewed illustrated footprints for named small venues, stalls and workshops. Positions come from the matching runtime place so reference-layout moves stay coupled.",
  "evidencePolicy": "Only add a venue after it is visibly named in an official-map reference. Do not use this layer for generic toilets, bars, food pins or inferred market clusters.",
  "venues": [
    {
      "name": "Energy Garden",
      "sourceName": "Energy Garden",
      "district": "Grand Central",
      "shape": "stall",
      "width": 2.2,
      "height": 1.15,
      "rotation": 18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Tinker Station",
      "sourceName": "Tinker Station",
      "district": "Grand Central",
      "shape": "stall",
      "width": 2.1,
      "height": 1.2,
      "rotation": -24,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "The Magic Teapot",
      "sourceName": "The Magic Teapot",
      "district": "Grand Central",
      "shape": "stall",
      "width": 2.25,
      "height": 1.25,
      "rotation": 30,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Ancient Futures",
      "sourceName": "Ancient Futures",
      "district": "Grand Central",
      "shape": "round",
      "width": 2.55,
      "height": 2.15,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Circus",
      "sourceName": "Circus",
      "district": "Grand Central",
      "shape": "round",
      "width": 2.35,
      "height": 2.05,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Craft Tent",
      "sourceName": "Craft Tent",
      "district": "Grand Central",
      "shape": "stall",
      "width": 2.35,
      "height": 1.2,
      "rotation": 16,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Games Lounge",
      "sourceName": "Games Lounge",
      "district": "Grand Central",
      "shape": "round",
      "width": 2.25,
      "height": 1.85,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Cocaine Anonymous",
      "sourceName": "Cocaine Anonymous",
      "district": "Grand Central",
      "shape": "stall",
      "width": 1.85,
      "height": 1.05,
      "rotation": 18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Spinney Hollow",
      "sourceName": "Spinney Hollow",
      "district": "Grand Central",
      "shape": "yard",
      "width": 2.3,
      "height": 1.5,
      "rotation": -14,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Reel News",
      "sourceName": "Reel News",
      "district": "Grand Central",
      "shape": "stall",
      "width": 2.1,
      "height": 1.05,
      "rotation": 2,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "The Pomegranate Parlour",
      "sourceName": "The Pomegranate Parlour",
      "district": "Oldtown",
      "shape": "stall",
      "width": 2.35,
      "height": 1.2,
      "rotation": -12,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Mining for (g)Old Town",
      "sourceName": "Mining for (g)Old Town",
      "district": "Oldtown",
      "shape": "stall",
      "width": 2.05,
      "height": 1.1,
      "rotation": 24,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Den of Dis Order",
      "sourceName": "Den of Dis Order",
      "district": "Oldtown",
      "shape": "stall",
      "width": 1.95,
      "height": 1.05,
      "rotation": -20,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Trough Love",
      "sourceName": "Trough Love",
      "district": "Oldtown",
      "shape": "yard",
      "width": 2.65,
      "height": 1.8,
      "rotation": 10,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Da Graaf's Reformatory",
      "sourceName": "Da Graaf's Reformatory",
      "district": "Oldtown",
      "shape": "stall",
      "width": 2.05,
      "height": 1.05,
      "rotation": 20,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "La Luna Coven",
      "sourceName": "La Luna Coven",
      "district": "Oldtown",
      "shape": "stall",
      "width": 1.95,
      "height": 1.05,
      "rotation": -18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Buskers Wharf",
      "sourceName": "Buskers Wharf",
      "district": "Oldtown",
      "shape": "stall",
      "width": 2.2,
      "height": 1.2,
      "rotation": 4,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "The Feckless Wrecked",
      "sourceName": "The Feckless Wrecked",
      "district": "Oldtown",
      "shape": "stall",
      "width": 2.05,
      "height": 1.1,
      "rotation": 30,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "The Boomtown Bobbies",
      "sourceName": "The Boomtown Bobbies",
      "district": "Botanica",
      "shape": "stall",
      "width": 2.2,
      "height": 1.15,
      "rotation": -12,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Luck Exchange Casino",
      "sourceName": "Luck Exchange Casino",
      "district": "Botanica",
      "shape": "round",
      "width": 2.35,
      "height": 1.95,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Hotel Paradiso",
      "sourceName": "Hotel Paradiso",
      "district": "Botanica",
      "shape": "stall",
      "width": 2.35,
      "height": 1.25,
      "rotation": 18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Soapranos Laundrette",
      "sourceName": "Soapranos Laundrette",
      "district": "Botanica",
      "shape": "stall",
      "width": 2.2,
      "height": 1.1,
      "rotation": -22,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Botanica Zoo",
      "sourceName": "Botanica Zoo",
      "district": "Botanica",
      "shape": "yard",
      "width": 2.6,
      "height": 1.8,
      "rotation": 8,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "The Garden Centre",
      "sourceName": "The Garden Centre",
      "district": "Botanica",
      "shape": "stall",
      "width": 2.15,
      "height": 1.15,
      "rotation": 26,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Mango",
      "sourceName": "Mango",
      "district": "Botanica",
      "shape": "round",
      "width": 2.1,
      "height": 1.75,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Karma Ceuticals",
      "sourceName": "Karma Ceuticals",
      "district": "Botanica",
      "shape": "stall",
      "width": 2,
      "height": 1.05,
      "rotation": -18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Sub Lab",
      "sourceName": "Sub Lab",
      "district": "Metropolis",
      "shape": "round",
      "width": 2.35,
      "height": 1.95,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Memory Mart",
      "sourceName": "Memory Mart",
      "district": "Metropolis",
      "shape": "stall",
      "width": 1.95,
      "height": 1.05,
      "rotation": 10,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Better You",
      "sourceName": "Better You",
      "district": "Metropolis",
      "shape": "stall",
      "width": 1.95,
      "height": 1.05,
      "rotation": -12,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "BBXL Info",
      "sourceName": "BBXL Info",
      "district": "Metropolis",
      "shape": "stall",
      "width": 1.65,
      "height": 0.95,
      "rotation": 18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "E Numbers",
      "sourceName": "E Numbers",
      "district": "Metropolis",
      "shape": "stall",
      "width": 2.05,
      "height": 1.1,
      "rotation": -18,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Gabber Kebabber",
      "sourceName": "Gabber Kebabber",
      "district": "Metropolis",
      "shape": "stall",
      "width": 2.2,
      "height": 1.15,
      "rotation": 16,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Loconnection",
      "sourceName": "Loconnection",
      "district": "Metropolis",
      "shape": "stall",
      "width": 1.85,
      "height": 1,
      "rotation": -20,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Nachtlicker",
      "sourceName": "Nachtlicker",
      "district": "Metropolis",
      "shape": "stall",
      "width": 1.95,
      "height": 1.05,
      "rotation": 22,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "Deviant Lounge",
      "sourceName": "Deviant Lounge",
      "district": "Area 404",
      "shape": "round",
      "width": 2.35,
      "height": 1.95,
      "rotation": 0,
      "label": true,
      "positionEvidence": "official-detail"
    },
    {
      "name": "BBXL",
      "sourceName": "BBXL",
      "district": "Area 404",
      "shape": "stall",
      "width": 2,
      "height": 1.05,
      "rotation": -16,
      "label": true,
      "positionEvidence": "official-detail"
    }
  ]
};

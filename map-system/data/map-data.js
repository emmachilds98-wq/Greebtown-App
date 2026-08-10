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
        "x": 53,
        "y": 51
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
        "x": 35,
        "y": 72
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
        "x": 15,
        "y": 67
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
        "x": 82,
        "y": 73
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
        "y": 26
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
        "x": 37,
        "y": 45
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
        "x": 37,
        "y": 63
      },
      "dimensions": {
        "width": 2.4,
        "height": 1.7
      },
      "transform": {
        "rotation": 0,
        "scale": 1
      },
      "layer": "structures",
      "asset": null,
      "metadata": {
        "description": "Compact venue immediately east of Quantum, before the Lion's Den corridor.",
        "category": "stage",
        "mapRole": "minor-stage",
        "accessibility": "",
        "notes": "Official-map detail review: a small venue beside Quantum, not a headline-stage footprint."
      }
    },
    {
      "id": "stage-spectrum-360",
      "type": "stage",
      "name": "Spectrum 360",
      "position": {
        "x": 32,
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
        "x": 29,
        "y": 35
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
        "x": 47,
        "y": 48
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
        "x": 44,
        "y": 39
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
        "x": 43,
        "y": 55
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
        "x": 58,
        "y": 48
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
        "x": 25,
        "y": 54
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
        "x": 45,
        "y": 60
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
        "x": 53,
        "y": 57
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
        "x": 29,
        "y": 55
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
        "x": 36,
        "y": 53
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
  "groundUseFields": [
    {
      "id": "hilltop-field",
      "name": "Hilltop Field",
      "kind": "ground-use",
      "surface": "hilltop-yellow",
      "evidence": "official-overview",
      "points": [
        [
          49,
          63
        ],
        [
          56,
          61
        ],
        [
          65,
          62
        ],
        [
          71,
          65
        ],
        [
          70,
          71
        ],
        [
          63,
          73
        ],
        [
          53,
          72
        ],
        [
          49,
          68
        ]
      ],
      "detailLines": [
        [
          [
            52,
            64
          ],
          [
            58,
            65
          ],
          [
            56,
            70
          ]
        ],
        [
          [
            57,
            63
          ],
          [
            64,
            66
          ],
          [
            62,
            72
          ]
        ],
        [
          [
            68,
            65
          ],
          [
            67,
            70
          ]
        ]
      ],
      "excludes": [
        "Anara Forest"
      ],
      "notes": "Rebuilt directly from IMG_3670: a broad, mostly east-west yellow field below Oldtown, tapering toward Quantum, with The Lion's Den south-west of its western end."
    },
    {
      "id": "sunset-field",
      "name": "Sunset Field",
      "kind": "ground-use",
      "surface": "hilltop-yellow",
      "evidence": "official-overview",
      "points": [
        [
          0,
          58
        ],
        [
          10,
          56
        ],
        [
          16,
          61
        ],
        [
          15,
          74
        ],
        [
          11,
          79
        ],
        [
          3,
          75
        ],
        [
          0,
          67
        ]
      ],
      "notes": "Rebuilt from IMG_3670: the separate large yellow Sunset field along Petersfield Road, west of the Lion's Den/Hilltop sequence."
    }
  ],
  "zones": [
    {
      "id": "camp-west",
      "name": "West Camping",
      "position": {
        "x": 69,
        "y": 16
      },
      "footprint": {
        "aspect": 1.55,
        "sides": 6,
        "rotation": -18
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "North-west field beside West Gate; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-downtown",
      "name": "Downtown Camping",
      "position": {
        "x": 38,
        "y": 25
      },
      "footprint": {
        "aspect": 1.35,
        "sides": 6,
        "rotation": 20
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "West-side camping in the reviewed gap between Meadow fields and the Downtown cluster, separate from Camp Orchid.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-meadow-accessible",
      "name": "Meadow Camping (Accessible)",
      "position": {
        "x": 28,
        "y": 16
      },
      "footprint": {
        "aspect": 1.45,
        "sides": 5,
        "rotation": -8
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Accessible meadow field.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-meadow-living",
      "name": "Meadow Living",
      "position": {
        "x": 31,
        "y": 18
      },
      "footprint": {
        "aspect": 1.35,
        "sides": 5,
        "rotation": 12
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Adjacent field, deliberately distinct from accessible camping.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-valley",
      "name": "Valley Camping",
      "position": {
        "x": 71,
        "y": 40
      },
      "footprint": {
        "aspect": 1.7,
        "sides": 6,
        "rotation": -12
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Northern valley field, wide and diagonally divided.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-tangerine",
      "name": "Tangerine Fields",
      "position": {
        "x": 95,
        "y": 49
      },
      "footprint": {
        "aspect": 1.45,
        "sides": 6,
        "rotation": 10
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Northern field east of Valley Camping.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-campervan",
      "name": "Campervan Field",
      "position": {
        "x": 42,
        "y": 95
      },
      "footprint": {
        "aspect": 0.68,
        "sides": 6,
        "rotation": -6
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "East-side vertical vehicle field. Moved south from (86,14) — that position sat north of Anara Forest, contradicting findings_screenshots.md's own note that East Camping/East Gate/Campervan Field appear together 'moving further east/south-east from Anara... along the perimeter road'. Repositioned near East Gate (site-layout.json parking-east-gate, 97,38) and East Camping (91,48), matching that progression.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-temple-valley",
      "name": "Temple Valley Camping",
      "position": {
        "x": 82,
        "y": 73
      },
      "footprint": {
        "aspect": 0.58,
        "sides": 6,
        "rotation": 4
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Long east-side camping field near East Gate.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-east",
      "name": "East Camping",
      "position": {
        "x": 88,
        "y": 86
      },
      "footprint": {
        "aspect": 0.72,
        "sides": 6,
        "rotation": -4
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "East-side field south of Temple Valley.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-quiet",
      "name": "Quiet Camping",
      "position": {
        "x": 91,
        "y": 79
      },
      "footprint": {
        "aspect": 0.78,
        "sides": 6,
        "rotation": 8
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "South-east quieter field.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-orchid-downtown",
      "name": "Camp Orchid Downtown",
      "position": {
        "x": 42,
        "y": 24
      },
      "footprint": {
        "aspect": 1.25,
        "sides": 4,
        "rotation": 25
      },
      "surface": "camp-premium",
      "evidence": "official-overview",
      "notes": "Premium public-transport camp; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-skylark-hilltop",
      "name": "Camp Skylark Hilltop",
      "position": {
        "x": 61,
        "y": 66
      },
      "footprint": {
        "aspect": 0.72,
        "sides": 7,
        "rotation": -8
      },
      "surface": "camp-premium",
      "evidence": "official-overview",
      "notes": "Premium Hilltop camp.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-skylark-sunset",
      "name": "Camp Skylark Sunset",
      "position": {
        "x": 9,
        "y": 62
      },
      "footprint": {
        "aspect": 1.28,
        "sides": 7,
        "rotation": 8
      },
      "surface": "camp-premium",
      "evidence": "official-overview",
      "notes": "Premium south-side camp near Sunset Hill.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
    },
    {
      "id": "camp-camplight",
      "name": "Camplight",
      "position": {
        "x": 34,
        "y": 20
      },
      "footprint": {
        "aspect": 1.15,
        "sides": 5,
        "rotation": -12
      },
      "surface": "camp-green",
      "evidence": "official-overview",
      "notes": "Separate labelled field next to Downtown Camping and Orchid in the reviewed west-side cluster.; position re-derived from the IMG_3670 full-site official overview (10 Aug 2026)."
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
          14,
          36
        ],
        [
          22,
          32
        ],
        [
          33,
          34
        ],
        [
          39,
          40
        ],
        [
          38,
          49
        ],
        [
          31,
          55
        ],
        [
          19,
          54
        ],
        [
          13,
          48
        ]
      ]
    },
    {
      "id": "district-botanica",
      "name": "Botanica",
      "evidence": "official-overview",
      "points": [
        [
          32,
          33
        ],
        [
          43,
          38
        ],
        [
          52,
          33
        ],
        [
          56,
          41
        ],
        [
          51,
          50
        ],
        [
          43,
          54
        ],
        [
          34,
          51
        ],
        [
          29,
          43
        ]
      ]
    },
    {
      "id": "district-area-404",
      "name": "Area 404",
      "evidence": "official-overview",
      "points": [
        [
          20,
          41
        ],
        [
          33,
          40
        ],
        [
          42,
          46
        ],
        [
          45,
          55
        ],
        [
          40,
          63
        ],
        [
          29,
          66
        ],
        [
          19,
          61
        ],
        [
          16,
          51
        ]
      ]
    },
    {
      "id": "district-letsbe-avenue",
      "name": "Letsbe Avenue",
      "evidence": "official-detail",
      "points": [
        [
          39,
          30
        ],
        [
          52,
          37
        ],
        [
          60,
          42
        ],
        [
          61,
          48
        ],
        [
          56,
          53
        ],
        [
          46,
          53
        ],
        [
          38,
          49
        ]
      ]
    },
    {
      "id": "district-oldtown",
      "name": "Oldtown",
      "evidence": "official-detail",
      "points": [
        [
          38,
          47
        ],
        [
          47,
          45
        ],
        [
          54,
          51
        ],
        [
          56,
          59
        ],
        [
          52,
          66
        ],
        [
          45,
          69
        ],
        [
          37,
          64
        ],
        [
          34,
          55
        ]
      ]
    }
  ]
};
window.GREEBTOWN_REFERENCE_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "schematic-percent-v1",
  "reviewedOverview": true,
  "reviewNote": "Canonical coordinates rebuilt directly from the IMG_3670 full-site official map composition. Legacy coordinate sources are not authoritative; no runtime anchor transform is applied.",
  "observations": [
    {
      "id": "official-overview-2026-08-03",
      "source": "User-provided official map overview screenshots",
      "evidence": "official-overview",
      "regions": [
        "site-perimeter",
        "arrival-roads",
        "west-camping",
        "downtown-camping",
        "hilltop-field",
        "lion-den-woodland",
        "east-camping"
      ],
      "notes": "The western camping and Downtown cluster are distinct field systems; the yellow Hilltop corridor sits west of the Lion's Den woodland mass and must not subsume Anara Forest. Alresford Road and Petersfield Road remain outside the festival interior."
    },
    {
      "id": "official-west-detail-2026-08-03",
      "source": "User-provided official map west/detail screenshots",
      "evidence": "official-detail",
      "regions": [
        "west-camping",
        "meadow-fields",
        "camp-orchid",
        "hidden-woods",
        "botanica"
      ],
      "notes": "West Camping is a large faceted field with internal divisions; Downtown Camping, Camplight and Meadow fields are separate labelled areas. Woodland runs continuously between the western fields and the Botanica/Letsbe edge."
    },
    {
      "id": "official-east-detail-2026-08-03",
      "source": "User-provided official map east/detail screenshots",
      "evidence": "official-detail",
      "regions": [
        "hilltop-field",
        "lion-den-woodland",
        "temple-valley-camping",
        "east-camping",
        "south-gate"
      ],
      "notes": "Hilltop reads as a long faceted yellow ground-use corridor. The Lion's Den sits in its own green clearing/woodland mass to the east, while the east-side campsite is a separate vertical green field."
    },
    {
      "id": "official-video-fullsite-2026-08-07",
      "source": "Frame extracted from a user-supplied official-app screen recording, full-site pan with Alresford Rd visible along the north edge (confirms true north-up, not rotated)",
      "evidence": "official-overview",
      "regions": [
        "copperwood",
        "grand-central",
        "lion-den",
        "quantum"
      ],
      "notes": "Two-point calibration (Botanica at its own reviewed anchor, Grand Central at its own reviewed anchor) landed Copperwood within ~3 units of its already-reviewed position - cross-check passed, left unchanged. The same calibration put a raw estimate for The Lion's Den around (60,54), but that pixel reading isn't trustworthy on its own (the source app supports rotation/tilt during a pan, so a single frame's absolute direction can't be taken at face value the way an adjacency/order reading can) - treated as a directional signal only ('somewhat closer to Grand Central/Oldtown than the previous (78,70) anchor'), not a coordinate to copy. Nudged to (81,65): the closest point to that raw estimate that still clears the already-reviewed hilltop-field ground-use polygon (checked programmatically against camp-zones.json/natural-area-footprints.json, not by eye). Quantum (a thingsToFind entry, not its own anchor) came out close enough to its current derived position (via the Oldtown anchor) to leave alone."
    },
    {
      "id": "official-fullsite-calibration-2026-08-10",
      "source": "IMG_3670, user-supplied official-app full-site overview",
      "evidence": "official-overview",
      "regions": [
        "downtown",
        "grand-central",
        "oldtown",
        "hilltop-field",
        "lion-den-woodland",
        "east-camping"
      ],
      "notes": "This is the shared calibration datum for the overview. It places Botanica/Metropolis/Area 404 as one compact west-city group; Grand Central north-west of Oldtown; the Hilltop field to Oldtown's east; and The Lion's Den south-west of that field. Earlier single-frame estimates that placed Lion's Den on the far east side or put Helix below it are superseded."
    }
  ],
  "anchors": {
    "Botanica": {
      "from": [
        42,
        41
      ],
      "to": [
        42,
        41
      ]
    },
    "Metropolis": {
      "from": [
        26,
        43
      ],
      "to": [
        26,
        43
      ]
    },
    "Area 404": {
      "from": [
        31,
        48
      ],
      "to": [
        31,
        48
      ]
    },
    "Letsbe Avenue": {
      "from": [
        45,
        43
      ],
      "to": [
        45,
        43
      ]
    },
    "Grand Central": {
      "from": [
        53,
        51
      ],
      "to": [
        53,
        51
      ]
    },
    "Oldtown": {
      "from": [
        45,
        57
      ],
      "to": [
        45,
        57
      ]
    },
    "Hydro XL": {
      "from": [
        15,
        67
      ],
      "to": [
        15,
        67
      ]
    },
    "Anara Forest": {
      "from": [
        82,
        73
      ],
      "to": [
        82,
        73
      ]
    },
    "The Lion's Den": {
      "from": [
        35,
        72
      ],
      "to": [
        35,
        72
      ]
    },
    "Helix": {
      "from": [
        37,
        63
      ],
      "to": [
        37,
        63
      ]
    },
    "Hidden Woods": {
      "from": [
        18,
        26
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
window.GREEBTOWN_NATURAL_AREA_FOOTPRINTS = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "anchor-relative-schematic-percent-v1",
  "purpose": "Reviewed non-camping natural-area silhouettes. A footprint follows its named source location after reference-layout transforms, preventing circular fallback zones.",
  "footprints": [
    {
      "id": "woodland-anara-forest",
      "name": "Anara Forest",
      "sourceName": "Anara Forest",
      "kind": "woodland",
      "evidence": "official-detail",
      "notes": "Compact wooded clearing, kept separate from the Hilltop ground-use corridor.",
      "points": [
        [
          -7.2,
          -4.8
        ],
        [
          -4.7,
          -8.5
        ],
        [
          1.4,
          -8.2
        ],
        [
          6.4,
          -4.7
        ],
        [
          7.3,
          0.5
        ],
        [
          4.9,
          5.7
        ],
        [
          -0.6,
          7.7
        ],
        [
          -5.7,
          4.9
        ],
        [
          -8.1,
          0.2
        ]
      ],
      "fringePoints": [
        [
          -9.1,
          -5.7
        ],
        [
          -5.8,
          -10.5
        ],
        [
          2.1,
          -10.1
        ],
        [
          8,
          -5.8
        ],
        [
          9.2,
          0.6
        ],
        [
          6.2,
          7
        ],
        [
          -0.8,
          9.4
        ],
        [
          -7.3,
          6.1
        ],
        [
          -10,
          0.2
        ]
      ],
      "treeClusters": [
        [
          -4.9,
          -3.2,
          7,
          2.15
        ],
        [
          -1.2,
          -6.1,
          7,
          2.15
        ],
        [
          3.9,
          -3,
          7,
          2.15
        ],
        [
          4.8,
          2.6,
          7,
          2.15
        ],
        [
          0,
          5.1,
          7,
          2.15
        ],
        [
          -5.1,
          2.2,
          7,
          2.15
        ]
      ]
    },
    {
      "id": "woodland-hidden-woods",
      "name": "Hidden Woods",
      "sourceName": "Hidden Woods",
      "kind": "woodland",
      "evidence": "official-detail",
      "notes": "Small irregular woodland pocket at the north-west edge of the city cluster.",
      "points": [
        [
          -6,
          -2.5
        ],
        [
          -3.6,
          -6.3
        ],
        [
          1.8,
          -6.8
        ],
        [
          5.7,
          -3.5
        ],
        [
          6.2,
          1.2
        ],
        [
          3.7,
          5.5
        ],
        [
          -1.3,
          7.1
        ],
        [
          -5.7,
          4.1
        ],
        [
          -7,
          0.3
        ]
      ],
      "fringePoints": [
        [
          -7.7,
          -3.2
        ],
        [
          -4.6,
          -8.1
        ],
        [
          2.3,
          -8.6
        ],
        [
          7.1,
          -4.4
        ],
        [
          7.8,
          1.5
        ],
        [
          4.7,
          6.8
        ],
        [
          -1.7,
          8.8
        ],
        [
          -7.2,
          5.2
        ],
        [
          -8.8,
          0.4
        ]
      ],
      "treeClusters": [
        [
          -4,
          -1.8,
          6,
          1.8
        ],
        [
          -1.5,
          -4.8,
          7,
          1.95
        ],
        [
          2.7,
          -3.2,
          6,
          1.8
        ],
        [
          4.1,
          1.4,
          7,
          1.95
        ],
        [
          0.5,
          4.8,
          6,
          1.8
        ],
        [
          -4.1,
          2.8,
          6,
          1.8
        ]
      ]
    },
    {
      "id": "woodland-lions-den",
      "name": "The Lion's Den woodland",
      "sourceName": "The Lion's Den",
      "kind": "woodland",
      "evidence": "official-detail",
      "notes": "Broad asymmetric eastern woodland mass beside, not inside, the Hilltop corridor; its long north/south edge keeps the amphitheatre clearing legible without reading as a circular camp zone. Scaled to 65% (was a 43x39-unit fringe, genuinely enormous relative to the ~20-30 unit gaps in this part of the site) after direct user feedback that Lion's Den sits far too far east/right — its old full size made ANY position close to Oldtown/Quantum geometrically impossible without overlapping the Hilltop corridor (checked directly with the same overlap-sweep script used previously), forcing it out to x~81 regardless of where the anchor was aimed. Still a genuinely broad woodland at this scale, just no longer implausibly larger than the districts around it.",
      "points": [
        [
          -8.5,
          -8.5
        ],
        [
          -3.3,
          -11.1
        ],
        [
          3.9,
          -10.4
        ],
        [
          9.1,
          -7.8
        ],
        [
          11.7,
          -3.3
        ],
        [
          12.4,
          2.6
        ],
        [
          9.8,
          8.5
        ],
        [
          4.6,
          11.1
        ],
        [
          -2.6,
          10.4
        ],
        [
          -8.5,
          7.2
        ],
        [
          -11.1,
          2.6
        ],
        [
          -11.7,
          -3.3
        ]
      ],
      "fringePoints": [
        [
          -9.8,
          -9.8
        ],
        [
          -3.9,
          -12.4
        ],
        [
          4.6,
          -11.7
        ],
        [
          10.4,
          -9.1
        ],
        [
          13.7,
          -3.9
        ],
        [
          14.3,
          3.3
        ],
        [
          11.7,
          10.4
        ],
        [
          5.2,
          13
        ],
        [
          -3.3,
          12.4
        ],
        [
          -10.4,
          8.5
        ],
        [
          -13,
          3.3
        ],
        [
          -13.7,
          -3.9
        ]
      ],
      "treeClusters": [
        [
          -7.2,
          -5.2,
          5.2,
          2.65
        ],
        [
          -3.3,
          -8.5,
          5.2,
          2.7
        ],
        [
          1.95,
          -8.5,
          5.2,
          2.65
        ],
        [
          6.5,
          -5.9,
          5.2,
          2.55
        ],
        [
          9.1,
          -1.3,
          5.2,
          2.5
        ],
        [
          7.8,
          4.6,
          5.2,
          2.55
        ],
        [
          3.3,
          8.5,
          5.2,
          2.65
        ],
        [
          -2.6,
          7.8,
          5.2,
          2.7
        ],
        [
          -7.2,
          5.2,
          5.2,
          2.6
        ],
        [
          -9.1,
          0.65,
          5.2,
          2.55
        ]
      ]
    }
  ]
};
window.GREEBTOWN_SITE_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "schematic-percent-v1",
  "siteBoundary": {
    "evidence": "official-overview",
    "points": [
      [
        -8,
        16
      ],
      [
        14,
        -8
      ],
      [
        73,
        -8
      ],
      [
        102,
        7
      ],
      [
        104,
        48
      ],
      [
        96,
        79
      ],
      [
        78,
        103
      ],
      [
        28,
        106
      ],
      [
        -8,
        82
      ],
      [
        -12,
        47
      ]
    ],
    "notes": "Illustrated full-site perimeter aligned to the west Downtown lobe, eastern Hilltop lobe and southern road edge."
  },
  "hilltopDivider": {
    "evidence": "official-detail",
    "points": [
      [
        59,
        17
      ],
      [
        58,
        28
      ],
      [
        58.5,
        40
      ],
      [
        58,
        52
      ],
      [
        60,
        64
      ]
    ],
    "notes": "Non-walkable dark divider running down the western edge of the reviewed Hilltop ground-use corridor."
  },
  "parkingAreas": [
    {
      "id": "parking-east-gate",
      "name": "White Carparks (East Gate)",
      "position": {
        "x": 97,
        "y": 38
      },
      "desiredRadius": 10,
      "footprint": {
        "aspect": 0.52,
        "sides": 4,
        "rotation": 2
      },
      "evidence": "official-detail",
      "notes": "Long vertical grey arrival/parking field east of Temple Valley Camping."
    },
    {
      "id": "parking-south-gate",
      "name": "White Carpark 4 (South Gate)",
      "position": {
        "x": 80,
        "y": 71
      },
      "desiredRadius": 8,
      "footprint": {
        "aspect": 1.45,
        "sides": 5,
        "rotation": -10
      },
      "evidence": "official-detail",
      "notes": "Wide southern arrival field beside the road and Camp Skylark Sunset approach."
    }
  ],
  "gateForecourts": [
    {
      "sourceName": "West Gate",
      "footprint": {
        "width": 2.4,
        "height": 1.35,
        "sides": 4,
        "rotation": -18
      },
      "evidence": "official-overview",
      "notes": "Small west-edge threshold at the Downtown / west-camping approach; deliberately compact so it does not become a new district."
    },
    {
      "sourceName": "East Gate",
      "footprint": {
        "width": 1.45,
        "height": 2.35,
        "sides": 4,
        "rotation": 2
      },
      "evidence": "official-detail",
      "notes": "Narrow north-east arrival threshold, aligned vertically with the reviewed east car-park edge."
    },
    {
      "sourceName": "South Gate",
      "footprint": {
        "width": 2.55,
        "height": 1.35,
        "sides": 4,
        "rotation": -10
      },
      "evidence": "official-detail",
      "notes": "Broad south-road threshold at the Camp Skylark approach."
    },
    {
      "sourceName": "Campervan Gate",
      "footprint": {
        "width": 1.45,
        "height": 1.05,
        "sides": 4,
        "rotation": -10
      },
      "evidence": "official-detail",
      "notes": "Compact hardstanding beside, but distinct from, South Gate and the southern car-park field."
    }
  ]
};
window.GREEBTOWN_STAGE_PRECINCT_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "anchor-relative-schematic-percent-v1",
  "purpose": "Reviewed foreground courts and street-spines for the central Hilltop sequence. These are illustrated walkable surfaces, not new venue or amenity locations.",
  "precincts": [
    {
      "id": "grand-central-forecourt",
      "sourceName": "Grand Central",
      "kind": "stage-forecourt",
      "offset": {
        "x": -1.55,
        "y": 1.9
      },
      "footprint": {
        "width": 11.4,
        "height": 5.2,
        "sides": 7,
        "rotation": -16
      },
      "evidence": "official-detail",
      "notes": "A broad, slightly south-west-facing main-stage forecourt, scaled from the official Hilltop sequence so Grand Central reads as an open destination rather than a small circular plaza."
    },
    {
      "id": "oldtown-street-spine",
      "sourceName": "Oldtown",
      "kind": "district-concourse",
      "offset": {
        "x": -0.45,
        "y": 0.85
      },
      "footprint": {
        "width": 12.2,
        "height": 4.7,
        "sides": 6,
        "rotation": 76
      },
      "evidence": "official-detail",
      "notes": "Long, tapering Oldtown civic spine sized from the official detail view: a connected street and venue run below Grand Central, never an isolated round clearing."
    },
    {
      "id": "ancient-futures-court",
      "sourceName": "Ancient Futures",
      "kind": "venue-court",
      "offset": {
        "x": -0.5,
        "y": -0.7
      },
      "footprint": {
        "width": 7.3,
        "height": 3.5,
        "sides": 6,
        "rotation": -24
      },
      "evidence": "official-detail",
      "notes": "Small shared workshop court for the Ancient Futures, Circus, Crafts and Games cluster above the main Oldtown run."
    },
    {
      "id": "botanica-garden-court",
      "sourceName": "Botanica",
      "kind": "district-concourse",
      "offset": {
        "x": -0.6,
        "y": 0.5
      },
      "footprint": {
        "width": 8.2,
        "height": 5.1,
        "sides": 8,
        "rotation": -14
      },
      "evidence": "official-detail",
      "notes": "Wide softened garden court around Botanica's clustered venues, avoiding a uniform round plaza while preserving its wooded edge."
    },
    {
      "id": "metropolis-street-court",
      "sourceName": "Metropolis",
      "kind": "district-concourse",
      "offset": {
        "x": 0.5,
        "y": -0.3
      },
      "footprint": {
        "width": 8.6,
        "height": 4.1,
        "sides": 6,
        "rotation": 26
      },
      "evidence": "official-detail",
      "notes": "Oblong built street court for the Metropolis venue run, so its stalls and stages read as an urban cluster rather than a round island."
    },
    {
      "id": "area-404-civic-court",
      "sourceName": "Area 404",
      "kind": "district-concourse",
      "offset": {
        "x": 0.3,
        "y": 0.8
      },
      "footprint": {
        "width": 7.8,
        "height": 5,
        "sides": 7,
        "rotation": 18
      },
      "evidence": "official-detail",
      "notes": "Faceted civic court for the denser Area 404 complex, keeping its hard-edged built mass distinct from Botanica and Metropolis."
    },
    {
      "id": "letsbe-avenue-street-court",
      "sourceName": "Letsbe Avenue",
      "kind": "district-concourse",
      "offset": {
        "x": 0.1,
        "y": 0.3
      },
      "footprint": {
        "width": 9.2,
        "height": 3.3,
        "sides": 6,
        "rotation": -18
      },
      "evidence": "official-detail",
      "notes": "Long narrow high-street court beneath the Letsbe Avenue venue loop, matching its continuous street character instead of a bulbous clearing."
    },
    {
      "id": "hydro-xl-forecourt",
      "sourceName": "Hydro XL",
      "kind": "stage-forecourt",
      "offset": {
        "x": 0.8,
        "y": -0.2
      },
      "footprint": {
        "width": 7.7,
        "height": 4.4,
        "sides": 6,
        "rotation": 22
      },
      "evidence": "official-detail",
      "notes": "A broad angled stage front for Hydro XL that makes the Downtown flagship read as a deliberate destination rather than a lone marker."
    },
    {
      "id": "quantum-junction-court",
      "sourceName": "Quantum",
      "kind": "venue-court",
      "offset": {
        "x": 0,
        "y": 0.2
      },
      "footprint": {
        "width": 5.2,
        "height": 3.4,
        "sides": 6,
        "rotation": 8
      },
      "evidence": "official-detail",
      "notes": "Compact faceted junction court at Quantum, preserving the legible branch between Oldtown, Helix and the Lion's Den without inventing paths."
    },
    {
      "id": "helix-pocket-venue",
      "sourceName": "Helix",
      "kind": "venue-court",
      "offset": {
        "x": 0.3,
        "y": 0
      },
      "footprint": {
        "width": 3.2,
        "height": 2,
        "sides": 6,
        "rotation": -14
      },
      "evidence": "official-detail",
      "notes": "A deliberately compact pocket venue immediately east of Quantum, keeping Helix legible without giving it a headline-stage field."
    },
    {
      "id": "spectrum-360-arena-court",
      "sourceName": "Spectrum 360",
      "kind": "venue-court",
      "offset": {
        "x": 0.2,
        "y": 0.25
      },
      "footprint": {
        "width": 5.4,
        "height": 4.3,
        "sides": 9,
        "rotation": -10
      },
      "evidence": "official-detail",
      "notes": "A compact rounded court around the container arena so the Area 404 landmark reads as a destination, not an oversized isolated marker."
    },
    {
      "id": "full-moon-ballroom-court",
      "sourceName": "Full Moon Ballroom",
      "kind": "venue-court",
      "offset": {
        "x": -0.15,
        "y": 0.35
      },
      "footprint": {
        "width": 4.8,
        "height": 3.6,
        "sides": 8,
        "rotation": 6
      },
      "evidence": "official-detail",
      "notes": "A small rounded hilltop court for the marquee, preserving the Ballroom's distinct venue scale beside the Grand Central sequence."
    },
    {
      "id": "hangar-161-yard",
      "sourceName": "Hangar 161",
      "kind": "stage-forecourt",
      "offset": {
        "x": 0.1,
        "y": -0.25
      },
      "footprint": {
        "width": 5.8,
        "height": 3,
        "sides": 5,
        "rotation": 12
      },
      "evidence": "official-detail",
      "notes": "A narrow hard-edged yard for Hangar 161, echoing its industrial character while keeping the Area 404 cluster compact."
    },
    {
      "id": "tribe-of-frog-clearing",
      "sourceName": "Tribe of Frog",
      "kind": "venue-court",
      "offset": {
        "x": -0.25,
        "y": 0.15
      },
      "footprint": {
        "width": 4.4,
        "height": 3.1,
        "sides": 7,
        "rotation": 20
      },
      "evidence": "official-detail",
      "notes": "A modest wooded-edge clearing for Tribe of Frog, visually connected to Oldtown without adding a false camp or zoning boundary."
    }
  ]
};
window.GREEBTOWN_DISTRICT_MASSING_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "anchor-relative-schematic-percent-v1",
  "purpose": "Reviewed, original illustrated building massing for the map's dense districts. These are non-interactive structures and yards, not new named venues, amenities or paths.",
  "clusters": [
    {
      "id": "grand-central-hilltop-compound",
      "sourceName": "Grand Central",
      "evidence": "official-detail",
      "notes": "Grand Central has a wide open stage face, with the smaller structures gathered in a broken northern and eastern edge rather than filling its central grass.",
      "masses": [
        {
          "id": "gc-north-workshop",
          "offset": {
            "x": -3.7,
            "y": -2.3
          },
          "width": 2.1,
          "height": 1.1,
          "rotation": -18,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "gc-north-tent",
          "offset": {
            "x": -1.4,
            "y": -2.6
          },
          "width": 1.7,
          "height": 1.5,
          "rotation": 8,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "gc-north-yard",
          "offset": {
            "x": 1,
            "y": -2.45
          },
          "width": 2.2,
          "height": 1,
          "rotation": 18,
          "tone": "ochre",
          "kind": "yard"
        },
        {
          "id": "gc-east-stall-one",
          "offset": {
            "x": 3.25,
            "y": -1.35
          },
          "width": 1.55,
          "height": 1,
          "rotation": 78,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "gc-east-stall-two",
          "offset": {
            "x": 3.55,
            "y": 0.45
          },
          "width": 1.8,
          "height": 1.05,
          "rotation": 76,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "gc-south-east-yard",
          "offset": {
            "x": 2.65,
            "y": 2
          },
          "width": 2.35,
          "height": 1.35,
          "rotation": 28,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "gc-west-kiosk",
          "offset": {
            "x": -3.5,
            "y": 1.55
          },
          "width": 1.45,
          "height": 1,
          "rotation": -30,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "gc-north-east-canopy",
          "offset": {
            "x": 2.45,
            "y": -2.55
          },
          "width": 1.55,
          "height": 1.3,
          "rotation": 22,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "gc-east-stall-three",
          "offset": {
            "x": 3.75,
            "y": 1.75
          },
          "width": 1.65,
          "height": 1,
          "rotation": 72,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "gc-south-west-kiosk",
          "offset": {
            "x": -3.3,
            "y": 2.55
          },
          "width": 1.55,
          "height": 0.95,
          "rotation": -18,
          "tone": "ochre",
          "kind": "stall"
        }
      ]
    },
    {
      "id": "oldtown-street-rooms",
      "sourceName": "Oldtown",
      "evidence": "official-detail",
      "notes": "Oldtown reads as two irregular, close-set street edges around a long open spine, with small courtyards and no broad circular plaza.",
      "masses": [
        {
          "id": "old-west-one",
          "offset": {
            "x": -3.25,
            "y": -2.45
          },
          "width": 1.8,
          "height": 1,
          "rotation": 16,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "old-west-two",
          "offset": {
            "x": -3.75,
            "y": -0.8
          },
          "width": 2.15,
          "height": 1.1,
          "rotation": 20,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "old-west-yard",
          "offset": {
            "x": -3.35,
            "y": 1.05
          },
          "width": 2.5,
          "height": 1.5,
          "rotation": 10,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "old-west-three",
          "offset": {
            "x": -2.8,
            "y": 2.75
          },
          "width": 1.85,
          "height": 1,
          "rotation": -16,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "old-east-one",
          "offset": {
            "x": 3.2,
            "y": -2.2
          },
          "width": 1.75,
          "height": 1.05,
          "rotation": -14,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "old-east-two",
          "offset": {
            "x": 3.75,
            "y": -0.45
          },
          "width": 2.1,
          "height": 1.1,
          "rotation": -18,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "old-east-three",
          "offset": {
            "x": 3.35,
            "y": 1.35
          },
          "width": 1.7,
          "height": 1.05,
          "rotation": -22,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "old-east-yard",
          "offset": {
            "x": 3,
            "y": 2.95
          },
          "width": 2.25,
          "height": 1.4,
          "rotation": -12,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "old-west-south-kiosk",
          "offset": {
            "x": -2.7,
            "y": 4.15
          },
          "width": 1.65,
          "height": 1,
          "rotation": -20,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "old-east-south-kiosk",
          "offset": {
            "x": 2.8,
            "y": 4
          },
          "width": 1.75,
          "height": 1.05,
          "rotation": -14,
          "tone": "terracotta",
          "kind": "stall"
        }
      ]
    },
    {
      "id": "botanica-garden-market",
      "sourceName": "Botanica",
      "evidence": "official-detail",
      "notes": "Botanica keeps a looser garden court, with an uneven eastern market arc and compact low structures leading toward NEXUS rather than a rigid grid.",
      "masses": [
        {
          "id": "bot-north-kiosk",
          "offset": {
            "x": -0.6,
            "y": -3.15
          },
          "width": 1.65,
          "height": 1,
          "rotation": 8,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "bot-east-one",
          "offset": {
            "x": 3.3,
            "y": -1.9
          },
          "width": 1.7,
          "height": 1,
          "rotation": 55,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "bot-east-two",
          "offset": {
            "x": 4,
            "y": -0.1
          },
          "width": 2.2,
          "height": 1.15,
          "rotation": 58,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "bot-east-yard",
          "offset": {
            "x": 3.35,
            "y": 1.8
          },
          "width": 2.35,
          "height": 1.45,
          "rotation": 42,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "bot-south-one",
          "offset": {
            "x": 1.3,
            "y": 3
          },
          "width": 1.7,
          "height": 1.15,
          "rotation": -12,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "bot-south-two",
          "offset": {
            "x": -1.35,
            "y": 2.85
          },
          "width": 1.85,
          "height": 1.05,
          "rotation": 24,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "bot-west-yard",
          "offset": {
            "x": -3.25,
            "y": 0.9
          },
          "width": 2.3,
          "height": 1.55,
          "rotation": -26,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "bot-north-west-canopy",
          "offset": {
            "x": -2.7,
            "y": -2
          },
          "width": 1.55,
          "height": 1.25,
          "rotation": -18,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "bot-east-three",
          "offset": {
            "x": 3.8,
            "y": 1.35
          },
          "width": 1.6,
          "height": 1,
          "rotation": 48,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "bot-south-east-kiosk",
          "offset": {
            "x": 2.75,
            "y": 2.75
          },
          "width": 1.6,
          "height": 0.95,
          "rotation": -20,
          "tone": "ochre",
          "kind": "stall"
        }
      ]
    },
    {
      "id": "metropolis-block-run",
      "sourceName": "Metropolis",
      "evidence": "official-detail",
      "notes": "Metropolis is a compact built street: aligned but varied blocks along its central run, leaving a clear route through the district rather than a scatter of isolated huts.",
      "masses": [
        {
          "id": "metro-north-one",
          "offset": {
            "x": -3.55,
            "y": -1.55
          },
          "width": 2,
          "height": 1.05,
          "rotation": 18,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "metro-north-two",
          "offset": {
            "x": -1.2,
            "y": -2.1
          },
          "width": 1.75,
          "height": 1,
          "rotation": 12,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "metro-north-three",
          "offset": {
            "x": 1.1,
            "y": -1.9
          },
          "width": 1.8,
          "height": 1.1,
          "rotation": 8,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "metro-east-yard",
          "offset": {
            "x": 3.25,
            "y": -0.55
          },
          "width": 2.45,
          "height": 1.5,
          "rotation": 76,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "metro-south-one",
          "offset": {
            "x": 1.95,
            "y": 2
          },
          "width": 1.75,
          "height": 1,
          "rotation": -20,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "metro-south-two",
          "offset": {
            "x": -0.25,
            "y": 2.4
          },
          "width": 2.05,
          "height": 1.05,
          "rotation": -14,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "metro-south-three",
          "offset": {
            "x": -2.5,
            "y": 1.75
          },
          "width": 1.65,
          "height": 1,
          "rotation": -28,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "metro-west-entry-kiosk",
          "offset": {
            "x": -4.15,
            "y": -0.1
          },
          "width": 1.55,
          "height": 0.95,
          "rotation": 20,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "metro-east-mid-stall",
          "offset": {
            "x": 3.4,
            "y": 1.2
          },
          "width": 1.8,
          "height": 1,
          "rotation": 70,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "metro-south-yard",
          "offset": {
            "x": 0.2,
            "y": 3.55
          },
          "width": 2.15,
          "height": 1.25,
          "rotation": -12,
          "tone": "dark",
          "kind": "yard"
        }
      ]
    },
    {
      "id": "area-404-industrial-yard",
      "sourceName": "Area 404",
      "evidence": "official-detail",
      "notes": "Area 404 stays more open and industrial than the town districts, using scattered long blocks, a hard-edged yard and deliberate space around Spectrum and Hangar 161.",
      "masses": [
        {
          "id": "area-west-hangar-row",
          "offset": {
            "x": -3.7,
            "y": -1.45
          },
          "width": 2.9,
          "height": 1.15,
          "rotation": 14,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "area-north-unit",
          "offset": {
            "x": -0.8,
            "y": -2.75
          },
          "width": 2.2,
          "height": 1.15,
          "rotation": -12,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "area-east-unit",
          "offset": {
            "x": 3.55,
            "y": -1
          },
          "width": 2.45,
          "height": 1.2,
          "rotation": 70,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "area-east-yard",
          "offset": {
            "x": 3.75,
            "y": 1.1
          },
          "width": 2.65,
          "height": 1.55,
          "rotation": 64,
          "tone": "dark",
          "kind": "yard"
        },
        {
          "id": "area-south-one",
          "offset": {
            "x": 1.55,
            "y": 2.9
          },
          "width": 2.25,
          "height": 1.05,
          "rotation": -22,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "area-south-two",
          "offset": {
            "x": -1.45,
            "y": 2.65
          },
          "width": 1.85,
          "height": 1.1,
          "rotation": 20,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "area-west-entry-stall",
          "offset": {
            "x": -4.25,
            "y": 0.3
          },
          "width": 1.8,
          "height": 1,
          "rotation": 16,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "area-north-east-tent",
          "offset": {
            "x": 1.7,
            "y": -2.65
          },
          "width": 1.65,
          "height": 1.3,
          "rotation": -10,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "area-east-late-stall",
          "offset": {
            "x": 4.05,
            "y": 2.8
          },
          "width": 1.75,
          "height": 1,
          "rotation": 58,
          "tone": "terracotta",
          "kind": "stall"
        },
        {
          "id": "area-south-west-yard",
          "offset": {
            "x": -3.15,
            "y": 3.2
          },
          "width": 2.15,
          "height": 1.35,
          "rotation": 22,
          "tone": "dark",
          "kind": "yard"
        }
      ]
    },
    {
      "id": "quantum-pocket-venues",
      "sourceName": "Quantum",
      "evidence": "official-detail",
      "notes": "Quantum is a sparse junction beside Hilltop: a few compact structures guide the turn toward Helix, without becoming another district or field-sized venue compound.",
      "masses": [
        {
          "id": "quantum-west-kiosk",
          "offset": {
            "x": -2.2,
            "y": -0.9
          },
          "width": 1.45,
          "height": 0.9,
          "rotation": 18,
          "tone": "ochre",
          "kind": "stall"
        },
        {
          "id": "quantum-east-tent",
          "offset": {
            "x": 2.1,
            "y": -0.65
          },
          "width": 1.35,
          "height": 1.2,
          "rotation": -18,
          "tone": "canvas",
          "kind": "tent"
        },
        {
          "id": "quantum-south-kiosk",
          "offset": {
            "x": 0.4,
            "y": 1.85
          },
          "width": 1.55,
          "height": 0.95,
          "rotation": 8,
          "tone": "terracotta",
          "kind": "stall"
        }
      ]
    }
  ]
};
window.GREEBTOWN_DISTRICT_PASSAGE_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "anchor-relative-schematic-percent-v1",
  "purpose": "Reviewed original close-zoom passages inside the core festival districts. These are illustrated walking surfaces that connect their authored massing; they do not assert new public routes or named locations.",
  "clusters": [
    {
      "id": "grand-central-approaches",
      "sourceName": "Grand Central",
      "evidence": "official-detail",
      "notes": "The stage keeps a broad clear face while a shallow fork reaches the northern structures and a quieter eastern service edge, rather than a circular plaza of paths.",
      "passages": [
        {
          "id": "gc-stage-approach",
          "kind": "street",
          "width": 0.72,
          "points": [
            [
              -0.4,
              4.1
            ],
            [
              -0.15,
              1.7
            ],
            [
              0.2,
              -0.55
            ]
          ]
        },
        {
          "id": "gc-north-fork",
          "kind": "lane",
          "width": 0.42,
          "points": [
            [
              0.1,
              -0.45
            ],
            [
              -1.8,
              -1.4
            ],
            [
              -3.65,
              -1.9
            ]
          ]
        },
        {
          "id": "gc-east-edge",
          "kind": "service",
          "width": 0.35,
          "points": [
            [
              0.2,
              -0.4
            ],
            [
              2.25,
              -0.7
            ],
            [
              3.3,
              0.9
            ],
            [
              2.55,
              2.35
            ]
          ]
        }
      ]
    },
    {
      "id": "oldtown-street-spine",
      "sourceName": "Oldtown",
      "evidence": "official-detail",
      "notes": "Oldtown is a long narrow street with broken side entries; its circulation must remain a central run between the two close-set building edges, never a round central court.",
      "passages": [
        {
          "id": "oldtown-main-run",
          "kind": "street",
          "width": 0.66,
          "points": [
            [
              0.1,
              -4.4
            ],
            [
              -0.15,
              -2
            ],
            [
              0.05,
              0.1
            ],
            [
              0.25,
              2.4
            ],
            [
              -0.25,
              4.45
            ]
          ]
        },
        {
          "id": "oldtown-west-entry",
          "kind": "lane",
          "width": 0.38,
          "points": [
            [
              -0.15,
              -0.25
            ],
            [
              -1.5,
              -0.6
            ],
            [
              -2.95,
              -0.25
            ]
          ]
        },
        {
          "id": "oldtown-east-entry",
          "kind": "lane",
          "width": 0.38,
          "points": [
            [
              0.1,
              1.5
            ],
            [
              1.55,
              1.75
            ],
            [
              3,
              1.15
            ]
          ]
        }
      ]
    },
    {
      "id": "botanica-garden-walks",
      "sourceName": "Botanica",
      "evidence": "official-detail",
      "notes": "Botanica reads as a loose garden market with walking arcs around an open middle and a defined eastern vendor edge, rather than an orthogonal town grid.",
      "passages": [
        {
          "id": "botanica-garden-arc",
          "kind": "street",
          "width": 0.55,
          "points": [
            [
              -3.65,
              0.8
            ],
            [
              -2.1,
              -1.8
            ],
            [
              0.2,
              -2.75
            ],
            [
              2.45,
              -1.65
            ],
            [
              3.55,
              0.35
            ]
          ]
        },
        {
          "id": "botanica-market-arc",
          "kind": "lane",
          "width": 0.42,
          "points": [
            [
              3.55,
              0.35
            ],
            [
              2.75,
              1.75
            ],
            [
              1.1,
              2.8
            ],
            [
              -1.15,
              2.75
            ]
          ]
        }
      ]
    },
    {
      "id": "metropolis-built-run",
      "sourceName": "Metropolis",
      "evidence": "official-detail",
      "notes": "Metropolis has a compact diagonal built run with a small turn at the south, so the passage follows the low roof blocks rather than cutting across the district as a broad square.",
      "passages": [
        {
          "id": "metropolis-main-run",
          "kind": "street",
          "width": 0.58,
          "points": [
            [
              -4,
              -1.8
            ],
            [
              -1.8,
              -1.25
            ],
            [
              0.45,
              -0.65
            ],
            [
              2.55,
              0.45
            ],
            [
              2.2,
              2.25
            ]
          ]
        },
        {
          "id": "metropolis-south-turn",
          "kind": "lane",
          "width": 0.4,
          "points": [
            [
              2.25,
              2.2
            ],
            [
              0.1,
              2.75
            ],
            [
              -2.3,
              2.1
            ]
          ]
        }
      ]
    },
    {
      "id": "area-404-industrial-lanes",
      "sourceName": "Area 404",
      "evidence": "official-detail",
      "notes": "Area 404 remains open and industrial: a broken hardstanding approach follows its long blocks with a short cross-lane, preserving the large clear spaces around the compact venues.",
      "passages": [
        {
          "id": "area-404-primary-lane",
          "kind": "street",
          "width": 0.62,
          "points": [
            [
              -4.25,
              -1.6
            ],
            [
              -1.65,
              -1.1
            ],
            [
              0.8,
              -0.35
            ],
            [
              3.6,
              0.8
            ]
          ]
        },
        {
          "id": "area-404-yard-turn",
          "kind": "service",
          "width": 0.36,
          "points": [
            [
              0.8,
              -0.35
            ],
            [
              0.6,
              1.55
            ],
            [
              1.8,
              2.75
            ]
          ]
        }
      ]
    },
    {
      "id": "quantum-junction-ways",
      "sourceName": "Quantum",
      "evidence": "official-detail",
      "notes": "Quantum is a small, sparse turning point beside Hilltop and Helix, so two narrow crossing paths are sufficient and must not grow into a district-sized paved surface.",
      "passages": [
        {
          "id": "quantum-crossing",
          "kind": "street",
          "width": 0.46,
          "points": [
            [
              -3,
              -0.85
            ],
            [
              -0.35,
              -0.05
            ],
            [
              2.85,
              0.85
            ]
          ]
        },
        {
          "id": "quantum-helix-turn",
          "kind": "lane",
          "width": 0.34,
          "points": [
            [
              -0.35,
              -0.05
            ],
            [
              0.25,
              1.35
            ],
            [
              0.65,
              2.55
            ]
          ]
        }
      ]
    }
  ]
};
window.GREEBTOWN_DISTRICT_ATMOSPHERE_LAYOUT = {
  "schemaVersion": "1.0.0",
  "coordinateSystem": "anchor-relative-schematic-percent-v1",
  "purpose": "Reviewed, original close-zoom atmosphere details for the six dense districts. They are non-interactive illustrated planters, canopies, seating, art pieces and light points, never new venues, amenities, camps or directions.",
  "clusters": [
    {
      "id": "grand-central-foreground",
      "sourceName": "Grand Central",
      "evidence": "official-detail",
      "notes": "Grand Central retains a broad clear stage face, with a handful of warm gathering objects on the quieter outer edges to make the forecourt feel occupied without blocking its open lawn.",
      "features": [
        {
          "id": "gc-west-canopy",
          "kind": "canopy",
          "tone": "canvas",
          "offset": {
            "x": -3,
            "y": 1.3
          },
          "size": 0.78,
          "rotation": -20
        },
        {
          "id": "gc-east-planter",
          "kind": "planter",
          "tone": "leaf",
          "offset": {
            "x": 2.3,
            "y": 1.25
          },
          "size": 0.55,
          "rotation": 0
        },
        {
          "id": "gc-north-art",
          "kind": "art",
          "tone": "ember",
          "offset": {
            "x": 0.75,
            "y": -1.8
          },
          "size": 0.52,
          "rotation": 12
        },
        {
          "id": "gc-south-seating",
          "kind": "seating",
          "tone": "wood",
          "offset": {
            "x": -1.7,
            "y": 2.8
          },
          "size": 0.68,
          "rotation": 22
        },
        {
          "id": "gc-light-one",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": -1,
            "y": 0.75
          },
          "size": 0.24,
          "rotation": 0
        },
        {
          "id": "gc-light-two",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": 1.15,
            "y": 1.45
          },
          "size": 0.24,
          "rotation": 0
        }
      ]
    },
    {
      "id": "oldtown-street-atmosphere",
      "sourceName": "Oldtown",
      "evidence": "official-detail",
      "notes": "Oldtown is a tight vertical street, so its details stay narrow and edge-bound: warm lamps, small planted corners and low seating rather than a freestanding central object or plaza ring.",
      "features": [
        {
          "id": "oldtown-north-planter",
          "kind": "planter",
          "tone": "leaf",
          "offset": {
            "x": -1.25,
            "y": -2.6
          },
          "size": 0.48,
          "rotation": 0
        },
        {
          "id": "oldtown-east-seating",
          "kind": "seating",
          "tone": "wood",
          "offset": {
            "x": 1.4,
            "y": -0.9
          },
          "size": 0.6,
          "rotation": -18
        },
        {
          "id": "oldtown-west-seating",
          "kind": "seating",
          "tone": "wood",
          "offset": {
            "x": -1.55,
            "y": 1.25
          },
          "size": 0.58,
          "rotation": 16
        },
        {
          "id": "oldtown-south-art",
          "kind": "art",
          "tone": "ember",
          "offset": {
            "x": 0.95,
            "y": 2.65
          },
          "size": 0.45,
          "rotation": 42
        },
        {
          "id": "oldtown-light-one",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": 0.3,
            "y": -1.85
          },
          "size": 0.22,
          "rotation": 0
        },
        {
          "id": "oldtown-light-two",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": -0.2,
            "y": 0.55
          },
          "size": 0.22,
          "rotation": 0
        },
        {
          "id": "oldtown-light-three",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": 0.15,
            "y": 2.1
          },
          "size": 0.22,
          "rotation": 0
        }
      ]
    },
    {
      "id": "botanica-garden-atmosphere",
      "sourceName": "Botanica",
      "evidence": "official-detail",
      "notes": "Botanica is the greenest town compound, with a loose garden middle, a few shade canopies and circular planted moments around the market edge instead of closely packed industrial furniture.",
      "features": [
        {
          "id": "botanica-west-planter",
          "kind": "planter",
          "tone": "leaf",
          "offset": {
            "x": -2.35,
            "y": 0.35
          },
          "size": 0.68,
          "rotation": 0
        },
        {
          "id": "botanica-north-canopy",
          "kind": "canopy",
          "tone": "canvas",
          "offset": {
            "x": -0.2,
            "y": -2
          },
          "size": 0.76,
          "rotation": 18
        },
        {
          "id": "botanica-east-planter",
          "kind": "planter",
          "tone": "leaf",
          "offset": {
            "x": 2.6,
            "y": -0.15
          },
          "size": 0.55,
          "rotation": 0
        },
        {
          "id": "botanica-south-seating",
          "kind": "seating",
          "tone": "wood",
          "offset": {
            "x": 0.3,
            "y": 2.35
          },
          "size": 0.7,
          "rotation": -8
        },
        {
          "id": "botanica-art",
          "kind": "art",
          "tone": "violet",
          "offset": {
            "x": -0.7,
            "y": 0.3
          },
          "size": 0.46,
          "rotation": 10
        },
        {
          "id": "botanica-light-one",
          "kind": "light",
          "tone": "cool",
          "offset": {
            "x": 1.35,
            "y": 1.5
          },
          "size": 0.23,
          "rotation": 0
        },
        {
          "id": "botanica-light-two",
          "kind": "light",
          "tone": "cool",
          "offset": {
            "x": -1.45,
            "y": 1.65
          },
          "size": 0.23,
          "rotation": 0
        }
      ]
    },
    {
      "id": "metropolis-street-atmosphere",
      "sourceName": "Metropolis",
      "evidence": "official-detail",
      "notes": "Metropolis is a compact, built street; its foreground detail uses small hard-edged seating, art and lights placed along the run rather than turning the middle into another landscaped garden.",
      "features": [
        {
          "id": "metropolis-north-seating",
          "kind": "seating",
          "tone": "wood",
          "offset": {
            "x": -1.8,
            "y": -0.8
          },
          "size": 0.62,
          "rotation": 14
        },
        {
          "id": "metropolis-west-art",
          "kind": "art",
          "tone": "ember",
          "offset": {
            "x": -3,
            "y": 0.65
          },
          "size": 0.5,
          "rotation": 26
        },
        {
          "id": "metropolis-east-planter",
          "kind": "planter",
          "tone": "leaf",
          "offset": {
            "x": 2.35,
            "y": 0.25
          },
          "size": 0.45,
          "rotation": 0
        },
        {
          "id": "metropolis-south-canopy",
          "kind": "canopy",
          "tone": "canvas",
          "offset": {
            "x": -0.35,
            "y": 2.25
          },
          "size": 0.7,
          "rotation": -12
        },
        {
          "id": "metropolis-light-one",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": -0.3,
            "y": -0.55
          },
          "size": 0.22,
          "rotation": 0
        },
        {
          "id": "metropolis-light-two",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": 1.25,
            "y": 0.55
          },
          "size": 0.22,
          "rotation": 0
        }
      ]
    },
    {
      "id": "area-404-yard-atmosphere",
      "sourceName": "Area 404",
      "evidence": "official-detail",
      "notes": "Area 404 stays sparse and industrial, so its details are isolated hard-edged art, utility seating and low light points with plenty of exposed ground remaining between the venue compounds.",
      "features": [
        {
          "id": "area-404-west-art",
          "kind": "art",
          "tone": "violet",
          "offset": {
            "x": -2.85,
            "y": -0.55
          },
          "size": 0.62,
          "rotation": -16
        },
        {
          "id": "area-404-north-seating",
          "kind": "seating",
          "tone": "wood",
          "offset": {
            "x": -0.2,
            "y": -2.15
          },
          "size": 0.62,
          "rotation": -8
        },
        {
          "id": "area-404-east-art",
          "kind": "art",
          "tone": "ember",
          "offset": {
            "x": 2.85,
            "y": 0.1
          },
          "size": 0.54,
          "rotation": 32
        },
        {
          "id": "area-404-south-canopy",
          "kind": "canopy",
          "tone": "canvas",
          "offset": {
            "x": 0.25,
            "y": 2.4
          },
          "size": 0.72,
          "rotation": 28
        },
        {
          "id": "area-404-light-one",
          "kind": "light",
          "tone": "cool",
          "offset": {
            "x": -1.2,
            "y": 0.95
          },
          "size": 0.24,
          "rotation": 0
        },
        {
          "id": "area-404-light-two",
          "kind": "light",
          "tone": "cool",
          "offset": {
            "x": 1.4,
            "y": 1.3
          },
          "size": 0.24,
          "rotation": 0
        }
      ]
    },
    {
      "id": "quantum-junction-atmosphere",
      "sourceName": "Quantum",
      "evidence": "official-detail",
      "notes": "Quantum remains a small junction beside Hilltop and Helix, with only a few compact recognisable details marking its turn and no dense furniture that would make it read as a separate district.",
      "features": [
        {
          "id": "quantum-west-planter",
          "kind": "planter",
          "tone": "leaf",
          "offset": {
            "x": -1.35,
            "y": 0.35
          },
          "size": 0.43,
          "rotation": 0
        },
        {
          "id": "quantum-east-canopy",
          "kind": "canopy",
          "tone": "canvas",
          "offset": {
            "x": 1.4,
            "y": -0.45
          },
          "size": 0.58,
          "rotation": -22
        },
        {
          "id": "quantum-turn-art",
          "kind": "art",
          "tone": "violet",
          "offset": {
            "x": 0.1,
            "y": 1.2
          },
          "size": 0.42,
          "rotation": 18
        },
        {
          "id": "quantum-light",
          "kind": "light",
          "tone": "warm",
          "offset": {
            "x": 0.55,
            "y": 0.2
          },
          "size": 0.21,
          "rotation": 0
        }
      ]
    }
  ]
};

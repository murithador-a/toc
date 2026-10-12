"""
Builds the optimised image set for the TOC Luxury Constructions website.

IMPORTANT — content integrity
-----------------------------
Every photograph downloaded here is TEMPORARY REFERENCE IMAGERY from Unsplash
(free-to-use licence). None of it depicts a TOC Luxury Constructions Ltd project.
The site labels each image accordingly and each entry in this manifest has a
matching record in src/data/imagery.ts, so replacing a photograph is a one-line
change (swap the file in public/images/ and update that record).

Usage:  python3 tools/build-images.py
"""
import os, io, json, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "images")
os.makedirs(OUT, exist_ok=True)

# key -> (unsplash photo id, photographer/credit, subject description, source page)
IMAGES = {
    "hero-residence": ("1600596542815-ffad4c1539a9", "Unsplash", "Contemporary low-rise residence with swimming pool", "https://unsplash.com/photos/1600596542815-ffad4c1539a9"),
    "about-planning": ("1503387762-592deb58ef4e", "Unsplash", "Drawings and scale rule on a design desk", "https://unsplash.com/photos/1503387762-592deb58ef4e"),
    "about-finishing": ("1600566753086-00f18fb6b3ea", "Unsplash", "Interior living space with full-height glazing", "https://unsplash.com/photos/1600566753086-00f18fb6b3ea"),
    "site-structure": ("1504307651254-35680f356dfd", "Unsplash", "Reinforcement and formwork on a building structure", "https://unsplash.com/photos/1504307651254-35680f356dfd"),
    "service-building": ("1504307651254-35680f356dfd", "Unsplash", "Building structure under construction with steel reinforcement", "https://unsplash.com/photos/1504307651254-35680f356dfd"),
    "service-residential": ("1613490493576-7fde63acd811", "Unsplash", "Modern residence with timber soffit and pool terrace", "https://unsplash.com/photos/1613490493576-7fde63acd811"),
    "service-structural": ("1541888946425-d81bb19240f5", "Unsplash", "Large slab and ground works with site team", "https://unsplash.com/photos/1541888946425-d81bb19240f5"),
    "service-supervision": ("1600585154526-990dced4db0d", "Unsplash", "Architect reviewing construction drawings", "https://unsplash.com/photos/1600585154526-990dced4db0d"),
    "p1-a": ("1600596542815-ffad4c1539a9", "Unsplash", "Contemporary residence exterior and pool", "https://unsplash.com/photos/1600596542815-ffad4c1539a9"),
    "p1-b": ("1600607687920-4e2a09cf159d", "Unsplash", "Dining area with bespoke joinery", "https://unsplash.com/photos/1600607687920-4e2a09cf159d"),
    "p1-c": ("1600573472550-8090b5e0745e", "Unsplash", "Lounge opening to pool terrace", "https://unsplash.com/photos/1600573472550-8090b5e0745e"),
    "p2-a": ("1600047509807-ba8f99d2cdde", "Unsplash", "Two-storey residence with landscaped frontage", "https://unsplash.com/photos/1600047509807-ba8f99d2cdde"),
    "p2-b": ("1600607688960-e095ff83135c", "Unsplash", "Residential elevation with mature planting", "https://unsplash.com/photos/1600607688960-e095ff83135c"),
    "p2-c": ("1600566752229-250ed79470f8", "Unsplash", "Kitchen with island and integrated appliances", "https://unsplash.com/photos/1600566752229-250ed79470f8"),
    "p3-a": ("1613490493576-7fde63acd811", "Unsplash", "Modern residence with timber ceiling and pool", "https://unsplash.com/photos/1613490493576-7fde63acd811"),
    "p3-b": ("1600585152220-90363fe7e115", "Unsplash", "Open-plan kitchen and living space", "https://unsplash.com/photos/1600585152220-90363fe7e115"),
    "p3-c": ("1600566752355-35792bedcfea", "Unsplash", "Bathroom with stone finishes", "https://unsplash.com/photos/1600566752355-35792bedcfea"),
    "p4-a": ("1600566753190-17f0baa2a6c3", "Unsplash", "Timber-clad house with walled courtyard", "https://unsplash.com/photos/1600566753190-17f0baa2a6c3"),
    "p4-b": ("1600607687939-ce8a6c25118c", "Unsplash", "Living room with full-height glazing", "https://unsplash.com/photos/1600607687939-ce8a6c25118c"),
    "p4-c": ("1600585153490-76fb20a32601", "Unsplash", "House facade lit at dusk", "https://unsplash.com/photos/1600585153490-76fb20a32601"),
    "p5-a": ("1541888946425-d81bb19240f5", "Unsplash", "Ground slab and structure works with site team", "https://unsplash.com/photos/1541888946425-d81bb19240f5"),
    "p5-b": ("1504307651254-35680f356dfd", "Unsplash", "Reinforcement cages and formwork", "https://unsplash.com/photos/1504307651254-35680f356dfd"),
    "p5-c": ("1600585154526-990dced4db0d", "Unsplash", "Drawing review on site documentation", "https://unsplash.com/photos/1600585154526-990dced4db0d"),
    "p6-a": ("1600585154340-be6161a56a0c", "Unsplash", "Dark contemporary residence among mature trees", "https://unsplash.com/photos/1600585154340-be6161a56a0c"),
    "p6-b": ("1600607688969-a5bfcd646154", "Unsplash", "Residence under mature canopy", "https://unsplash.com/photos/1600607688969-a5bfcd646154"),
    "p6-c": ("1600607687920-4e2a09cf159d", "Unsplash", "Interior joinery detail", "https://unsplash.com/photos/1600607687920-4e2a09cf159d"),
}

# key -> widths to export (webp)
SIZES = {
    "hero-residence": [1920, 1280, 800],
    "about-planning": [1200, 700],
    "about-finishing": [1200, 700],
    "site-structure": [1200, 700],
    "service-building": [1400, 900, 600],
    "service-residential": [1400, 900, 600],
    "service-structural": [1400, 900, 600],
    "service-supervision": [1400, 900, 600],
}
for k in IMAGES:
    if k not in SIZES:
        SIZES[k] = [1400, 900, 600]

def download(pid, width):
    url = f"https://images.unsplash.com/photo-{pid}?w={width}&q=80&fm=jpg&fit=max&auto=format"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read()

manifest = {}
for key, (pid, credit, desc, source) in IMAGES.items():
    widths = SIZES[key]
    raw = download(pid, max(widths) + 200)
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    files = []
    for w in widths:
        if im.width < w:
            w = im.width
        out = im.copy()
        out.thumbnail((w, 10000), Image.LANCZOS)
        name = f"{key}-{w}.webp"
        out.save(os.path.join(OUT, name), "WEBP", quality=80, method=6)
        files.append({"src": f"/images/{name}", "width": out.width, "height": out.height})
        if w == widths[0]:
            og = out.copy()
            og.thumbnail((1600, 1600), Image.LANCZOS)
    manifest[key] = {
        "temporary": True,
        "credit": credit,
        "description": desc,
        "source": source,
        "files": files,
    }
    print(f"{key:22} {im.width}x{im.height} -> {[f['src'] for f in files]}")

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)

# Open Graph / social card: crop the hero to 1200x630
hero = Image.open(io.BytesIO(download("1600596542815-ffad4c1539a9", 1600))).convert("RGB")
tw, th = 1200, 630
ratio = max(tw / hero.width, th / hero.height)
hero = hero.resize((int(hero.width * ratio), int(hero.height * ratio)), Image.LANCZOS)
left = (hero.width - tw) // 2
top = int((hero.height - th) * 0.55)
hero.crop((left, top, left + tw, top + th)).save(os.path.join(OUT, "og-toc.jpg"), "JPEG", quality=82, optimize=True)
print("og card written")

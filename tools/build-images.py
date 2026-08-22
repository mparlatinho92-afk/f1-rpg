#!/usr/bin/env python3
"""build-images.py — erzeugt data/images.js aus assets-backup/.

WOZU: Fahrerfotos und Team-Logos wurden zur Laufzeit von statsf1.com und
static.wikia.nocookie.net geholt. Beim Nutzer blockiert AdGuard die Wikia-Domain —
die Logos blieben graue Buchstabenkaesten, das Weltmeister-Foto eine Silhouette,
waehrend die Server sauber HTTP 200 lieferten. Ein Werbeblocker-Filter waere ein
Pflaster; richtig ist, dass der Monolith seine Bilder selbst mitbringt. Das ist
ohnehin das Projektziel: standalone, ohne externe Abhaengigkeiten.

ZWEI SORTEN, ZWEI VERFAHREN:
  * Fahrerfotos  -> WebP q80 in ORIGINALGROESSE (alle Quellen sind 200 px hoch).
    Kein Verkleinern: die Anzeige ist 110x130 CSS-Pixel, auf einem 2x-Schirm also
    220x260 — die Quelle ist bereits knapper als das. Gemessen an drei Gesichtern
    war 130 px sichtbar weicher (Haare, Hautstruktur), 200 px vom Original nicht zu
    unterscheiden. Ersparnis trotzdem 65 %, weil PNG fuer Fotos die falsche Wahl ist.
  * Team-Logos   -> Farbquantisierung auf 256 Farben, PNG, max 160 px.
    Flaechengrafiken verlieren dabei nichts (Hinweis aus dem Schwesterprojekt), und
    160 px ist genau 2x der 80-px-Anzeige im Steckbrief. Ersparnis rund 97 %:
    das Martini-Lotus-Logo faellt von 468 KB auf 16 KB.
    ⚠ FASTOCTREE, nicht MEDIANCUT — nur ersteres kann Alpha.

Aufruf:  python tools/build-images.py            (Trockenlauf, nur Bericht)
         python tools/build-images.py --write    (schreibt data/images.js)
"""
import base64
import re
import io
import json
import os
import sys
import urllib.parse

from PIL import Image
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BACKUP = os.path.join(ROOT, "assets-backup")
OUT = os.path.join(ROOT, "data", "images.js")
WRITE = "--write" in sys.argv

LOGO_MAX = 160          # 2x der 80-px-Anzeige im Team-Steckbrief
FOTO_QUALITAET = 80


def farbzahl(im):
    """Sichtbare Farben zaehlen (Alpha > 40) — unter 256 lohnt Quantisierung nicht."""
    a = np.asarray(im.convert("RGBA"))
    m = a[..., 3] > 40
    return len(np.unique(a[..., :3][m].reshape(-1, 3), axis=0)) if m.any() else 0


def als_datauri(daten, mime):
    return f"data:{mime};base64," + base64.b64encode(daten).decode("ascii")


def foto(pfad):
    im = Image.open(pfad)
    im.load()
    buf = io.BytesIO()
    im.convert("RGB").save(buf, "WEBP", quality=FOTO_QUALITAET, method=6)
    return als_datauri(buf.getvalue(), "image/webp"), buf.tell()


def svg_zu_bild(pfad):
    """SVG rastern. 103 der 286 Logo-Eintraege sind Vektorgrafiken — darunter ALLE
    McLaren-Aeren. Sie direkt einzubetten waere unbezahlbar: 5 MB roh, allein das
    Eisenacher Motorenwerk 1,7 MB, als Base64 zusammen 6,7 MB. Da die Anzeige nur
    80 CSS-Pixel misst, wird bei doppelter Zielbreite gerastert und danach wie jede
    andere Flaechengrafik behandelt."""
    import cairosvg
    png = cairosvg.svg2png(url=pfad, output_width=LOGO_MAX * 2)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def logo(pfad):
    if pfad.lower().endswith(".svg"):
        im = svg_zu_bild(pfad)
    else:
        im = Image.open(pfad)
        im.load()
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    if max(im.size) > LOGO_MAX:
        im.thumbnail((LOGO_MAX, LOGO_MAX), Image.LANCZOS)
    if farbzahl(im) > 256:
        im = im.quantize(colors=256, method=Image.FASTOCTREE).convert("RGBA")
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return als_datauri(buf.getvalue(), "image/png"), buf.tell()


manifest = json.load(open(os.path.join(BACKUP, "manifest.json"), encoding="utf-8"))

# ── Fahrerfotos: id (Fahrer-Slug) -> data-URI ──────────────────────────────
fotos, foto_bytes, foto_roh, foto_fehler = {}, 0, 0, 0
for e in manifest.get("driverPhotos", []):
    datei = e.get("file")
    if not datei:
        continue
    p = os.path.join(BACKUP, "drivers", datei)
    if not os.path.exists(p):
        foto_fehler += 1
        continue
    try:
        uri, n = foto(p)
        # Mehrere Fahrer teilen sich eine Datei (driverPhotosShared) — der Slug ist
        # der Schluessel, das Bild darf doppelt referenziert werden.
        fotos[e["id"]] = uri
        foto_bytes += n
        foto_roh += os.path.getsize(p)
    except Exception:
        foto_fehler += 1

# ── Externe Bilder: URL -> data-URI ────────────────────────────────────────
# Die gespiegelten Dateien tragen den Basename der URL. Was nicht als Bild
# vorliegt (SVG, fehlgeschlagene Abrufe), bleibt einfach aussen vor — der
# bisherige Netz-Pfad greift dort weiter.
logos, logo_bytes, logo_roh, logo_fehlt = {}, 0, 0, 0
def datei_fuer(url):
    """Namensregel EXAKT wie fileNameFor() in tools/mirror-external-images.js.
    Das Manifest fuehrt fuer `external` kein file-Feld, deshalb nachgebildet.
    ⚠ Wikia-URLs enden auf /revision/latest?cb=… — der Dateiname steht DAVOR.
      Wer nur den letzten Pfadteil nimmt, landet bei „latest" und findet nichts."""
    p = re.sub(r"/revision/latest.*$", "", url)
    p = re.sub(r"\?.*$", "", p)
    name = urllib.parse.unquote(p.rstrip("/").split("/")[-1] or "bild")
    name = re.sub(r"[^A-Za-z0-9_.-]+", "_", name)
    if not re.search(r"\.(png|jpe?g|svg|webp|gif)$", name, re.I):
        name += ".png"
    return name


for e in manifest.get("external", []):
    url = e.get("url")
    if not url:
        continue
    name = e.get("file") or datei_fuer(url)
    p = os.path.join(BACKUP, "external", name)
    if not os.path.exists(p) or not name.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")):
        logo_fehlt += 1
        continue
    try:
        uri, n = logo(p)
        logos[url] = uri
        logo_bytes += n
        logo_roh += os.path.getsize(p)
    except Exception:
        logo_fehlt += 1


def mb(x):
    return f"{x / 1024 / 1024:.2f} MB"


b64 = (foto_bytes + logo_bytes) * 4 / 3
print(f"Fahrerfotos : {len(fotos):>4}  {mb(foto_roh)} -> {mb(foto_bytes)}"
      f"  ({100 - 100 * foto_bytes / max(foto_roh, 1):.0f} % kleiner, {foto_fehler} uebersprungen)")
print(f"Externe Bilder: {len(logos):>2}  {mb(logo_roh)} -> {mb(logo_bytes)}"
      f"  ({100 - 100 * logo_bytes / max(logo_roh, 1):.0f} % kleiner, {logo_fehlt} ohne Datei)")
print(f"Als Base64 zusammen: {mb(b64)}")

block = f"""        // BILDER — Fahrerfotos und externe Grafiken, eingebettet.
        // GENERIERT von tools/build-images.py — NICHT von Hand editieren.
        //
        // Warum eingebettet: die Bilder kamen von statsf1.com und
        // static.wikia.nocookie.net. Beim Nutzer blockiert AdGuard die Wikia-Domain,
        // also blieben Team-Logos graue Kaesten und das Weltmeister-Foto eine
        // Silhouette — waehrend beide Server sauber HTTP 200 lieferten. Ein
        // Filter-Eintrag waere ein Pflaster; der Monolith soll seine Bilder selbst
        // mitbringen (Projektziel: standalone ohne externe Abhaengigkeiten).
        //
        // Verfahren: Fotos als WebP q{FOTO_QUALITAET} in Originalgroesse (alle Quellen
        // sind 200 px hoch, die Anzeige braucht 220x260 auf 2x — Verkleinern war
        // sichtbar schlechter). Flaechengrafiken auf {LOGO_MAX} px und 256 Farben
        // quantisiert; dort verliert man nichts, spart aber rund 97 %.
        //
        // DRIVER_PHOTOS: Fahrer-Slug -> data-URI ({len(fotos)} Fahrer)
        // EMBEDDED_IMAGES: urspruengliche URL -> data-URI ({len(logos)} Bilder)
        // Fehlt ein Eintrag, greift der bisherige Netz-Pfad unveraendert weiter.
        const DRIVER_PHOTOS = {json.dumps(fotos, separators=(',', ':'), sort_keys=True)};
        const EMBEDDED_IMAGES = {json.dumps(logos, separators=(',', ':'), sort_keys=True)};
"""

print(f"Dateigroesse data/images.js: {mb(len(block.encode('utf-8')))}")
if not WRITE:
    print("Trockenlauf — nichts geschrieben. Mit --write erzeugen.")
    sys.exit(0)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(block)
print(f"{OUT} geschrieben.")

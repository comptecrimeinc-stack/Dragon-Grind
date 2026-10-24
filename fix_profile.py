import pathlib

files = [
    r"c:\Users\antoi\Documents\GitHub\Dragon-Grind\Dragon_Grind_JOUABLE.html",
    r"c:\Users\antoi\Documents\GitHub\Dragon-Grind\version-legere\index.html",
]

old = (
    "    +(frId?'<p class=\"dgpc-frameline\">Cadre héraldique : "
    "<i class=\"dgpc-frame-gem\" style=\"color:'+DG_FRAME_COLORS[frId]+'\">"
    "'+DG_FRAME_GEMS[frId]+'</i> '+frameName+'</p>':'')\n"
    "    +cosmeticLine\n"
)

for p in files:
    path = pathlib.Path(p)
    s = path.read_text(encoding="utf-8")
    assert old in s, f"pattern not found in {p}"
    s = s.replace(old, "")
    path.write_text(s, encoding="utf-8")
    print("done", p)
PY
"""Tarifų Excel → normalizuoti duomenys (JSON + SQL).
Naudojimas: python3 parse_tariffs.py <tarifai.xlsx> <išvesties_aplankas>
"""
import json, re, sys
from pathlib import Path
import openpyxl

PORTS = {  # failo kodas → (rodomas pavadinimas, tvarka)
    "NORFOLK": ("Norfolk", 1), "SAVANNAH": ("Savannah", 2), "NEWARK": ("Newark (New York)", 3),
    "HOUSTON": ("Houston", 4), "MIAMI": ("Miami", 5), "CHICAGO": ("Chicago", 6),
    "TORONTO": ("Toronto", 7), "LOS ANGELES": ("Los Angeles", 8), "SEATTLE": ("Seattle", 9),
    "PORT OF HONOLULU": ("Honolulu", 10),
}
SIZE = {"1 Regular Car": "regular", "1 Large Car": "large", "Oversize Car": "oversize",
        "Motorcycle": "moto", "Large Motorcycle": "moto_large"}
CARGO = {"Car": "car", "Motorcycle": "moto"}
REGIONS = {  # JAV valstijos + Kanados provincijos (kaip faile)
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida",
    "Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine",
    "Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska",
    "Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
    "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas",
    "Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
    "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Lab","Nova Scotia",
    "Ontario","Quebec","Saskatchewan",
}


def parse_yard(raw: str):
    parts = [re.sub(r"\s+", " ", p).strip() for p in raw.split(" - ")]
    # valstija — paskutinis segmentas iš dešinės, esantis sąraše (ne paskutinis)
    idx = next((i for i in range(len(parts) - 2, -1, -1) if parts[i] in REGIONS), None)
    if idx is None:
        return {"city": " - ".join(parts[:-2]), "state": parts[-2], "auction": parts[-1], "needs_review": True}
    auction = " - ".join(parts[idx + 1:])
    if auction.startswith("NPA - "):
        auction = auction[6:]
    city = " - ".join(p for p in parts[:idx] if p)
    return {"city": city, "state": parts[idx], "auction": auction, "needs_review": city == ""}


def main(src, out):
    ws = openpyxl.load_workbook(src, data_only=True).active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    yards, routes, sea, problems = {}, {}, {}, []
    for a, _to, ct, tow, port, dest, oc, ocean, total in rows:
        if a is None:
            continue
        if port not in PORTS or oc not in SIZE or ct not in CARGO or dest != "KLAIPEDA":
            problems.append(f"Nežinoma reikšmė: {a} / {port} / {oc} / {ct} / {dest}")
            continue
        if abs((tow or 0) + (ocean or 0) - (total or 0)) > 0.01:
            problems.append(f"Suma nesutampa: {a} {oc}")
        yards.setdefault(a, parse_yard(a))
        key = (a, port, CARGO[ct])
        if key in routes and routes[key] != tow:
            problems.append(f"Skirtingos transporto kainos: {key}")
        routes[key] = tow
        s = (port, SIZE[oc])
        if s in sea and sea[s] != ocean:
            problems.append(f"Skirtingos jūros kainos: {s}")
        sea[s] = ocean

    data = {
        "ports": [{"code": c, "name": n, "sort": s} for c, (n, s) in PORTS.items()],
        "yards": [{"raw_name": k, **v} for k, v in sorted(yards.items())],
        "routes": [{"raw_name": a, "port": p, "cargo": c, "price": v} for (a, p, c), v in routes.items()],
        "sea": [{"port": p, "size": s, "price": v} for (p, s), v in sorted(sea.items())],
        "problems": problems,
    }
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    (out / "tariffs.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))

    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    sql = ["begin;", "delete from towing_routes; delete from sea_rates; delete from yards; delete from ports;"]
    sql.append("insert into ports(code,name,sort) values " + ",".join(
        f"({q(p['code'])},{q(p['name'])},{p['sort']})" for p in data["ports"]) + ";")
    sql.append("insert into yards(raw_name,city,state,auction,needs_review) values " + ",".join(
        f"({q(y['raw_name'])},{q(y['city'])},{q(y['state'])},{q(y['auction'])},{str(y['needs_review']).lower()})"
        for y in data["yards"]) + ";")
    sql.append("insert into towing_routes(yard_id,port_code,cargo_type,price_usd) select y.id, v.p, v.c, v.pr from (values "
               + ",".join(f"({q(r['raw_name'])},{q(r['port'])},{q(r['cargo'])},{r['price']})" for r in data["routes"])
               + ") v(n,p,c,pr) join yards y on y.raw_name = v.n;")
    sql.append("insert into sea_rates(port_code,size_class,price_usd) values " + ",".join(
        f"({q(s['port'])},{q(s['size'])},{s['price']})" for s in data["sea"]) + ";")
    sql.append("commit;")
    (out / "seed.sql").write_text("\n".join(sql))

    print(f"Eilučių: {len(rows)}, aikštelių: {len(yards)}, maršrutų: {len(routes)}, jūros tarifų: {len(sea)}")
    print(f"Peržiūrėti reikia: {sum(y['needs_review'] for y in yards.values())}, problemų: {len(problems)}")
    for p in problems[:20]:
        print(" -", p)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

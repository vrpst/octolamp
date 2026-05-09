import json

master = {}
years = ["2025", "2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]
for year in years:
    all_areas = set()
    with open(f'./public/geodata/lads/lads-{year}.geojson', ) as g:
        geo = json.load(g)      
        geo = geo['features']
        for i in geo:
            all_areas.add(i["properties"][f"LAD{year[2:]}CD"])
    with open(f'./public/geodata/cuas/cuas-{year}.geojson', ) as g:
        geo = json.load(g)      
        geo = geo['features']
        for i in geo:
            all_areas.add(i["properties"][f"CTYUA{year[2:]}CD"])
    all_areas = list(all_areas)
    year_master = {
        "CON": [0, 0],
        "LAB": [0, 0],
        "LD": [0, 0],
        "REF": [0, 0],
        "GRN": [0, 0],
        "SNP": [0, 0],
        "PC": [0, 0],
        "UKIP": [0, 0],
        "OTH": [0, 0],

    }
    year2 = str(year)
    while len(all_areas) != 0 and year2 != "2015":
        for area in ["lads", "cuas"]:
            with open(f'./public/data/{year2}/{area}/{year2}-{area}.json', ) as d:
                data = json.load(d)
                for k in data:
                    if k in all_areas:
                        if data[k]["control"] != "NOC":
                            year_master[data[k]["control"]][1] += 1
                        for idx, m in enumerate(data[k]["parties"]):
                            year_master[m][0] += data[k]["seats"][idx]
                        all_areas.remove(k)
        year2 = str(int(year2) - 1)
        if year2 == "2020":
            year2 = "2019"
        #print(all_areas)

    parties = ["CON", "LAB", "LD", "REF", "GRN", "SNP", "PC", "UKIP", "OTH"]
    councillors = []
    c_test = []
    councils = []
    order = []
    for i in parties:
        councillors.append(year_master[i][0])
        c_test.append(year_master[i][0])
        councils.append(year_master[i][1])
    for j in c_test:
        if councillors[c_test.index(max(c_test))] != 0:
            order.append(c_test.index(max(c_test)))
        c_test[c_test.index(max(c_test))] = -1
    
    final = {
        "parties": [parties[b] for b in order],
        "councillors": [councillors[b] for b in order],
        "councils": [councils[b] for b in order]
    }
    print(final)
    master[year] = final

for i in master:
    print(i, master[i])


with open('./public/data/menu.json', "w") as x:
    x.write(json.dumps(master, ensure_ascii=True))
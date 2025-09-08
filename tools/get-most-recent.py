import json
y = 24
data = {}
wards = []
with open(f'./geodata/wards-20{y}.geojson') as f:
    d = json.load(f)
    for i in d['features']:
        wards.append(i['properties'][f'WD{y-1}CD'])

for code in wards:        
    for j in range(y, 20, -1):
        with open(f'./data/20{j}/20{j}-simplified.json') as g:
            e = json.load(g)
            if code in e.keys():
                data[code] = e[code]
                data[code]['election'] = str(2000+j)
                break
    print(f"{wards.index(code)+1}/{len(wards)}")
    if code not in data.keys():
        data[code] = 2023 # SHOULD BE NONE BUT IT'S ONLY 2023 FOR NOW

with open(f'./data/20{y}/20{y}-past-elections.json', 'w') as h:
    h.write(json.dumps(data, ensure_ascii=True))


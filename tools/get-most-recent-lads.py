import json

ls = [25, 23, 22, 21, 19, 18, 17, 16]
for y in ls:
    data = {}
    wards = []

    with open(f'./geodata/lads/lads-20{y}.geojson') as f:
        d = json.load(f)
        for i in d['features']:
            wards.append(i['properties'][f'LAD{y}CD'])

    for code in wards:        
        for j in ls[ls.index(y):]:
            with open(f'./data/20{j}/20{j}-lads.json') as g:
                e = json.load(g)
                if code in e.keys():
                    data[code] = e[code]
                    data[code]['election'] = str(2000+j)
                    break
        #print(f"{wards.index(code)+1}/{len(wards)}")
        if code not in data.keys():
            print(code)
            data[code] = "NONE"
    with open(f'./data/20{y}/20{y}-lads-past-elections.json', 'w') as h:
        h.write(json.dumps(data, ensure_ascii=True))


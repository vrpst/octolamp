import json
def getMostRecent(ls, output, cd):
    for y in ls:
        data = {}
        wards = []

        with open(f'./geodata/{output}/{output}-20{y}.geojson') as f:
            d = json.load(f)
            for i in d['features']:
                wards.append(i['properties'][f'{cd}{y}CD'])

        for code in wards:        
            for j in ls[ls.index(y):]:
                with open(f'./data/20{j}/{output}/20{j}-{output}.json') as g:
                    e = json.load(g)
                    if code in e.keys():
                        data[code] = e[code]
                        data[code]['election'] = str(2000+j)
                        break
            #print(f"{wards.index(code)+1}/{len(wards)}")
            if code not in data.keys():
                print(y, code)
                data[code] = "NONE"
        with open(f'./data/20{y}/{output}/20{y}-{output}-past.json', 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))

getMostRecent([25, 24, 23, 22, 21, 19, 18, 17, 16], "lads", "LAD")  # DO LADS
getMostRecent([25, 24, 23, 22, 21, 19, 18, 17, 16], "cuas", "CTYUA")  # DO LADS
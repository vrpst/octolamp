import json

ls = [24, 23, 22, 21]
def getMostRecent(output, cd, filter):
    for y in ls:
        data = {}
        areas = []
        with open(f'./public/geodata/{output}/{output}-20{y}.geojson') as f:
            d = json.load(f)
            for i in d['features']:
                areas.append(i['properties'][f'{cd}{y}CD'])
                print(y, "appending", d['features'].index(i), len(d['features']))
        print("writing", y)
        for code in areas:
            for j in ls[ls.index(y):]:  # DO NOT REMOVE THE COLON
                with open(f'./public/data/20{j}/{output}/20{j}-{output}-{filter}.json') as g:
                    e = json.load(g)
                    if code in e.keys():
                        data[code] = e[code]
                        break
            #print(f"{areas.index(code)+1}/{len(areas)}")
        with open(f'./public/data/20{y}/{output}/20{y}-{output}-{filter}-past.json', 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))

def makeSimplifiedYear(output):
    for y in ls:
        print(y)
        data = {}
        with open(f'./public/data/20{y}/{output}/20{y}-{output}.json') as g:
            e = json.load(g)
            for code in e.keys():
                data[code] = {
                    "control": e[code]["control"],
                    "election": e[code]["election"]
                    }
        with open(f'./public/data/20{y}/{output}/20{y}-{output}-simp.json', 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))
        print("WRITTEN, MOVING ON")

makeSimplifiedYear("wards")
getMostRecent("wards", "WD", "simp")

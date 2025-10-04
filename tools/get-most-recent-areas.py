import json

ls = [25, 24, 23, 22, 21, 19, 18, 17, 16]
def getMostRecent(output, cd, filter):
    for y in ls:
        data = {}
        areas = []
        with open(f'./geodata/{output}/{output}-20{y}.geojson') as f:
            d = json.load(f)
            for i in d['features']:
                areas.append(i['properties'][f'{cd}{y}CD'])

        for code in areas:        
            for j in ls[ls.index(y):]:  # DO NOT REMOVE THE COLON
                with open(f'./data/20{j}/{output}/20{j}-{output}-{filter}.json') as g:
                    e = json.load(g)
                    if code in e.keys():
                        data[code] = e[code]
                        break
            #print(f"{areas.index(code)+1}/{len(areas)}")
            if code not in data.keys():
                print(y, code)
                data[code] = "NONE"
        with open(f'./data/20{y}/{output}/20{y}-{output}-{filter}-past.json', 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))

def makeSimplifiedYear(output):
    for y in ls:
        print(y)
        data = {}
        with open(f'./data/20{y}/{output}/20{y}-{output}.json') as g:
            e = json.load(g)
            for code in e.keys():
                print(code, e[code])
                data[code] = {
                    "control": e[code]["control"],
                    "prev_control": e[code]["prev_control"],
                    "election": e[code]["election"],
                    "plurality": e[code]["parties"][0],
                    "inc": e[code]["inc"],
                    "dec": e[code]["dec"]
                }
                if data[code]["control"] != data[code]["prev_control"] and data[code]["prev_control"] not in ["INIT", "DATA"]:
                    if data[code]["control"] != "NOC" and data[code]["prev_control"] != "NOC":
                        data[code]["change"] = "flip"
                    else:
                        data[code]["change"] = "gain"
                else:
                    data[code]["change"] = "none"
        with open(f'./data/20{y}/{output}/20{y}-{output}-simp.json', 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))

makeSimplifiedYear("lads")
makeSimplifiedYear("cuas")
getMostRecent("lads", "LAD", "simp")  # DO LADS
getMostRecent("cuas", "CTYUA", "simp")  # DO LADS
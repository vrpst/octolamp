import json

years = [26, 25, 24, 23, 22, 21, 19, 18, 17, 16]
def getMostRecent(output, cd, filter=""):
    for year in years:
        data = {}
        areas = []
        with open(f'./public/geodata/{output}/{output}-20{year}.geojson') as f:
            d = json.load(f)
            for i in d['features']:
                areas.append(i['properties'][f'{cd}{year}CD'])

        for code in areas:  # for all areas in the current year
            for j in years[years.index(year):]:  # for current and all older years
                with open(f'./public/data/20{j}/{output}/20{j}-{output}{filter}.json') as g:  # open the results for the year 
                    e = json.load(g)
                    if code in e.keys():
                        data[code] = e[code]  # add the code to the results
                        break

        # some elections are held BEFORE councils are added to the map
        # therefore ALSO store all elections related to geodata and any additional elections held in that year not on the map
        with open(f'./public/data/20{j}/{output}/20{j}-{output}{filter}.json') as x:
            base = json.load(x)
            for code in base.keys():
                if code not in data:  # add any extra codes not already read into data
                    data[code] = base[code]
        
        if filter == "-simp":
            writestr = f'./public/data/20{year}/{output}/20{year}-{output}-simp.json'
        else:
            writestr = f'./public/data/20{year}/{output}/20{year}-{output}.json'
        with open(writestr, 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))

def makeSimplifiedYear(output):
    for year in years:
        data = {}
        with open(f'./public/data/20{year}/{output}/20{year}-{output}.json') as g:
            e = json.load(g)
            for code in e.keys():
                data[code] = {
                    "control": e[code]["control"],
                    "prev_control": e[code]["prev_control"],
                    "election": e[code]["election"],
                    "plurality": e[code]["parties"][0],
                    "inc": e[code]["inc"],
                    "dec": e[code]["dec"]
                }
                # add flips
                if data[code]["control"] != data[code]["prev_control"] and data[code]["prev_control"] not in ["INIT", "DATA"]:
                    data[code]["change"] = "true"
                else:
                    data[code]["change"] = "false"
        with open(f'./public/data/20{year}/{output}/20{year}-{output}-simp.json', 'w') as h:
            h.write(json.dumps(data, ensure_ascii=True))

makeSimplifiedYear("lads")
makeSimplifiedYear("cuas")
getMostRecent("lads", "LAD")
getMostRecent("cuas", "CTYUA")
getMostRecent("lads", "LAD", "-simp")
getMostRecent("cuas", "CTYUA", "-simp")
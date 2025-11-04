import pandas as pd
import json

def checkValid(tocheck, typ):  # CHECK IF THE DATA APPLIES TO THE DESIRED TYPE
    if typ == "LAD":  # LAD
        if tocheck != "C":
            return True
        else:
            return False
    elif typ == "CUA":  # COUNTY AND UNITARY AUTHORITY
        if tocheck != "D":
            return True
        else:
            return False
    else:
        raise ValueError
    
def hashName2019(thing):
    print(thing)
    thing = thing.lower()
    thing = thing.replace(' ', '')
    thing = thing.replace('-','')
    thing = thing.replace("'","")
    thing = thing.replace("&","")
    thing = thing.replace("and","")
    thing = thing.replace("upon","on")
    thing = thing.replace(",","")
    thing = thing.replace("countyof","")
    thing = thing.replace("cityof","")
    thing = thing.replace("the","")
    thing = thing.replace("kingstonon","")
    return thing

def fillOut2024(p, d):
    d['parties'].append(p)
    d['seats'].append(0)
    return d


with open(f'./public/geodata/lads/lads-2019.geojson', ) as g2:  # thank you stack overflow
    geo = json.load(g2)      
    geo = geo['features']
with open(f'./public/geodata/lads/lads-2024.geojson', ) as g3:  # thank you stack overflow
    geo24 = json.load(g3)      
    geo24 = geo24['features']    
def generateResults(tp, output):
    years = ["2025", "2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]
    for year in years:
        print(year)
        df = pd.read_csv(f'./csvs/{year}.csv')
        data = {}

        def checkInCSV(name):
            data[code]["parties"].append(name)
            if name in df:
                data[code]["seats"].append(int(df.loc[i][name]))
            else:
                data[code]["seats"].append(0)
        
        if year == "2019":
            places = {}
            for place in geo:
                places[hashName2019(place['properties']['LAD19NM'])] = place['properties']['LAD19CD']  # generate dict of hash to code
        elif year == "2024":
            places = {}
            for place in geo24:
                places[hashName2019(place['properties']['LAD24NM'])] = place['properties']['LAD24CD']
        for i in range(len(df)):
            if checkValid(df.loc[i]['TYPE'], tp):
                if year not in ["2024", "2019"]:
                    code = df.loc[i]['CODE']
                else:
                    code = places[hashName2019(df.loc[i]['NAME'])]  # hash name and retrieve code
                data[code] = {
                    "total": int(df.loc[i]['TOTAL']),
                    "parties": ["CON", "LAB", "LD"],
                    "seats": [int(df.loc[i]['CON']), int(df.loc[i]['LAB']), int(df.loc[i]['LD'])],
                }
                checkInCSV("GRN")
                checkInCSV("SNP")
                checkInCSV("PC")
                checkInCSV("REF")
                checkInCSV("UKIP")
                checkInCSV("OTH")

                if max(data[code]['seats']) > 0.5*data[code]['total']:
                    data[code]['control'] = data[code]['parties'][data[code]['seats'].index(max(data[code]['seats']))]
                else:
                    data[code]['control'] = "NOC"
                data[code]['election'] = year
                data[code]['type'] = df.loc[i]['TYPE']
        with open(f'./public/data/{year}/{output}/{year}-{output}.json', 'w') as f:  # thank you stack overflow
            f.write(json.dumps(data, ensure_ascii=True))

    # GET FLIPS AND PREVIOUS ELECTION DATES
    years = ["2025", "2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]
    flips = years.copy()
    flips.reverse()
    flips = flips[:-1]
    results = {}
    print(years, flips)
    for i in years:
        print(years, flips)
        results = {}
        incdec = {}
        for j in flips:
            with open(f'./public/data/{j}/{output}/{j}-{output}.json') as f:
                g = json.load(f)
                for k in g:
                    results[k] = {}
                    incdec[k] = {}
                    results[k]['prev_up'] = j
                    results[k]['prev_control'] = g[k]['control']
                    incdec[k]["parties"] = g[k]["parties"]
                    incdec[k]["seats"] = g[k]["seats"]
        flips = flips[:-1]
        year_lads = []
        flip_lads = {}
        with open(f'./public/data/{i}/{output}/{i}-{output}.json') as x:
            y = json.load(x)
            for n in y:
                year_lads.append(n)
                flip_lads[n] = y[n]['control']
        print("WRITING", i)
        for m in year_lads:
            if m in results:
                incdec[m]["incdec"] = []
                for q in range(len(incdec[m]["parties"])):
                    incdec[m]["incdec"].append(y[m]["seats"][y[m]["parties"].index(incdec[m]["parties"][q])] - incdec[m]["seats"][q])
                y[m]['prev_up'] = results[m]['prev_up']
                y[m]['prev_control'] = results[m]['prev_control']
                y[m]['inc'] = incdec[m]["parties"][incdec[m]['incdec'].index(max(incdec[m]['incdec']))]
                y[m]['dec'] = incdec[m]["parties"][incdec[m]['incdec'].index(min(incdec[m]['incdec']))]
                if incdec[m]['incdec'].count(max(incdec[m]['incdec'])) > 1:
                    y[m]['inc'] = "NOC"
                if incdec[m]['incdec'].count(max(incdec[m]['incdec'])) > 1:
                    y[m]['dec'] = "NOC"
                if results[m]['prev_control'] != flip_lads[m]:
                    y[m]['flip'] = "true"
                else:
                    y[m]['flip'] = "false"
            elif (int(i) <= 2017 and m[:1] in ['S', 'W']) or (int(i) < 2019) or (int(i) == 2019 and (m not in ['E07000244', 'E07000246', 'E07000245', 'E06000058', ' E06000059'])) :  # GET TYPES AND DO IT THEN
                y[m]['prev_up'] = "DATA"
                y[m]['prev_control'] = "DATA"
                y[m]['flip'] = "DATA"
                y[m]['inc'] = "DATA"
                y[m]['dec'] = "DATA"
            else:
                y[m]['prev_up'] = "INIT"
                y[m]['prev_control'] = "INIT"
                y[m]['flip'] = "INIT"
                y[m]['inc'] = "INIT"
                y[m]['dec'] = "INIT"
        print("WRITTEN", i)
        with open(f'./public/data/{i}/{output}/{i}-{output}.json', "w") as x:
            x.write(json.dumps(y, ensure_ascii=True))

        print("")

    # ORDER THE RESULTS
    for y in years:
        print("SORTING ", y)
        with open(f'./public/data/{y}/{output}/{y}-{output}.json') as f:
            g = json.load(f)
        for lad in g.keys():
            max_parties = []
            max_seats = []
            while g[lad]["seats"] != []:
                maxi = g[lad]["seats"].index(max(g[lad]["seats"]))
                if max(g[lad]["seats"]) != 0:
                    max_seats.append(g[lad]["seats"][maxi])
                    max_parties.append(g[lad]["parties"][maxi])
                    del g[lad]["parties"][maxi]
                    del g[lad]["seats"][maxi]
                else:
                    break
            g[lad]["parties"] = max_parties
            g[lad]["seats"] = max_seats
        with open(f'./public/data/{y}/{output}/{y}-{output}.json', "w") as x:
            x.write(json.dumps(g, ensure_ascii=True))

generateResults("LAD", "lads")
generateResults("CUA", "cuas")
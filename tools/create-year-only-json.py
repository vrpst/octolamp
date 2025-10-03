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

with open(f'./geodata/lads/lads-2019.geojson', ) as g2:  # thank you stack overflow
    geo = json.load(g2)      
    geo = geo['features']  
def generateResults(tp, output):
    years = ["2025", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]
    for year in years:
        print(year)
        df = pd.read_csv(f'./csvs/lads/{year}.csv')
        data = {}

        def checkInCSV(name):
            if name in df:
                data[code]["parties"].append(name)
                data[code]["seats"].append(int(df.loc[i][name]))
        
        if year == "2019":
            places = {}
            for place in geo:
                places[hashName2019(place['properties']['LAD19NM'])] = place['properties']['LAD19CD']
        for i in range(len(df)):
            if checkValid(df.loc[i]['TYPE'], tp):
                if year != "2019":
                    code = df.loc[i]['CODE']
                else:
                    code = places[hashName2019(df.loc[i]['NAME'])]
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
        with open(f'./data/{year}/{output}/{year}-{output}.json', 'w') as f:  # thank you stack overflow
            f.write(json.dumps(data, ensure_ascii=True))

    # USE WARD DATA TO MAKE 2024 RESULT; doesn't actually matter since 2024 had no C elections
    year = "2024"
    print(year)
    df = pd.read_csv(f'./csvs/lads/{year}.csv')
    data = {}
    for i in range(len(df)):
        if checkValid(df.loc[i]['TYPE'], tp):
            code = df.loc[i]['CODE']
            if code not in data:
                data[code] = {}
                data[code]['total'] = 0
                data[code]['parties'] = []
                data[code]['seats'] = []
                data[code]['type'] = df.loc[i]['TYPE']
            if df.loc[i]["Elected"] == "Yes":
                data[code]['total'] += 1
                pg = df.loc[i]["Party Group"]
                if df.loc[i]["Party Group"] == "IND":  # change all independents to other for now
                    pg = "OTH"
                if pg not in data[code]['parties']:
                    data[code]['parties'].append(pg)
                    data[code]['seats'].append(0)
                data[code]['seats'][data[code]['parties'].index(pg)] += 1

            if max(data[code]['seats']) > 0.5*data[code]['total']:
                data[code]['control'] = data[code]['parties'][data[code]['seats'].index(max(data[code]['seats']))]
            else:
                data[code]['control'] = "NOC"
            data[code]['election'] = year
    with open(f'./data/{year}/{output}/{year}-{output}.json', "w") as f:  # thank you stack overflow
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
        for j in flips:
            with open(f'./data/{j}/{output}/{j}-{output}.json') as f:
                g = json.load(f)
                for k in g:
                    results[k] = {}
                    results[k]['prev_up'] = j
                    results[k]['prev_control'] = g[k]['control']
        flips = flips[:-1]
        year_lads = []
        flip_lads = {}
        with open(f'./data/{i}/{output}/{i}-{output}.json') as x:
            y = json.load(x)
            for n in y:
                year_lads.append(n)
                flip_lads[n] = y[n]['control']
        print("WRITING", i)
        for m in year_lads:
            if m in results:
                y[m]['prev_up'] = results[m]['prev_up']
                y[m]['prev_control'] = results[m]['prev_control']
                if results[m]['prev_control'] != flip_lads[m]:
                    y[m]['flip'] = "true"
                else:
                    y[m]['flip'] = "false"
            elif (int(i) <= 2017 and m[:1] in ['S', 'W']) or (int(i) < 2019) or (int(i) == 2019 and (m not in ['E07000244', 'E07000246', 'E07000245', 'E06000058', ' E06000059'])) :  # GET TYPES AND DO IT THEN
                y[m]['prev_up'] = "DATA"
                y[m]['prev_control'] = "DATA"
                y[m]['flip'] = "DATA"
            else:
                y[m]['prev_up'] = "INIT"
                y[m]['prev_control'] = "INIT"
                y[m]['flip'] = "INIT"
        print("WRITTEN", i)
        with open(f'./data/{i}/{output}/{i}-{output}.json', "w") as x:
            x.write(json.dumps(y, ensure_ascii=True))

        print("")

    # ORDER THE RESULTS
    for y in years:
        print("SORTING ", y)
        with open(f'./data/{y}/{output}/{y}-{output}.json') as f:
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
        with open(f'./data/{y}/{output}/{y}-{output}.json', "w") as x:
            x.write(json.dumps(g, ensure_ascii=True))

generateResults("LAD", "lads")
generateResults("CUA", "cuas")
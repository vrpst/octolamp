import pandas as pd
import json

def checkValid(tocheck, typ):  # split areas into LADs and CUAs (with overlap)
    if typ == "lads":  # LAD
        if tocheck != "C":  # if it's not a county council, it's an LAD
            return True
        else:
            return False
    elif typ == "cuas":  # COUNTY AND UNITARY AUTHORITY
        if tocheck != "D":  # if it's not a district council, it's a CUA
            return True
        else:
            return False
    else:
        raise ValueError
    
def hashName(place):  # hash 2019 data since it has no codes
    place = place.lower()
    place = place.replace(' ', '')
    place = place.replace('-','')
    place = place.replace("'","")
    place = place.replace("&","")
    place = place.replace("and","")
    place = place.replace("upon","on")
    place = place.replace(",","")
    place = place.replace("countyof","")
    place = place.replace("cityof","")
    place = place.replace("the","")
    place = place.replace("kingstonon","")
    return place

def fillOut2024(p, d):
    d['parties'].append(p)
    d['seats'].append(0)
    return d

def createComp(prev, n_seats, n_parties):
    # input will be all parties including ones that didn't run, so no worries about comparison errors
    o_seats = prev[0]
    o_parties = prev[1]
    data = {}
    for i, party in enumerate(o_parties):
        if n_seats[n_parties.index(party)] == 0 and o_seats[i] == 0:
            continue
        elif n_seats[n_parties.index(party)] > 0:
            data[party] = round((n_seats[n_parties.index(party)] - o_seats[i])/sum(n_seats), 3)
        else:
            data[party] = round((0 - o_seats[i])/sum(n_seats), 3)
    return data

with open('./public/geodata/lads/lads-2019.geojson', ) as g2:  # thank you stack overflow
    geo = json.load(g2)      
    geo = geo['features']
with open('./public/geodata/lads/lads-2024.geojson', ) as g3:  # thank you stack overflow
    geo24 = json.load(g3)      
    geo24 = geo24['features']

def generateResults(output):
    years = ["2026", "2025", "2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]
    # for each year
    for year in years:
        print(f"INITIAL\t{year}\t{output}")
        df = pd.read_csv(f'./csvs/{year}.csv')
        data = {}

        def addParty(name):
            data[code]["parties"].append(name)  # add the name to party list
            if name in df:  # if name in dataframe, use the seat total there, otherwise use 0
                data[code]["seats"].append(int(df.loc[i][name]))
            else:
                data[code]["seats"].append(0)
        
        if year == "2019":  # 2019 does not have area codes, hash the names instead
            places = {}  # create a mapping of hash -> area code
            for place in geo:
                places[hashName(place['properties']['LAD19NM'])] = place['properties']['LAD19CD']  # mapping for 2019
        elif year == "2024":
            places = {}
            for place in geo24:
                places[hashName(place['properties']['LAD24NM'])] = place['properties']['LAD24CD']  # mapping for 2024
        for i in range(len(df)):  # for every entry in the CSV
            if checkValid(df.loc[i]['TYPE'], output):  # check the correct area type
                if year not in ["2024", "2019"]: # just use the code if not 2019, 2024
                    code = df.loc[i]['CODE']
                else:  # if 2024 or 2019, use the hash to find the code
                    code = places[hashName(df.loc[i]['NAME'])]  # hash name and retrieve code
                data[code] = {
                    "total": int(df.loc[i]['TOTAL']),
                    "parties": ["CON", "LAB", "LD"],
                    "seats": [int(df.loc[i]['CON']), int(df.loc[i]['LAB']), int(df.loc[i]['LD'])],
                }
                # get the other party's votes
                addParty("GRN")
                addParty("SNP")
                addParty("PC")
                addParty("REF")
                addParty("UKIP")
                addParty("OTH")

                if max(data[code]['seats']) > 0.5*data[code]['total']:  # if majority control
                    data[code]['control'] = data[code]['parties'][data[code]['seats'].index(max(data[code]['seats']))]  # set control to that party
                else:
                    data[code]['control'] = "NOC"  # otherwise no overall control
                data[code]['election'] = year  # set year of election
                data[code]['type'] = df.loc[i]['TYPE']  # set council type
        with open(f'./public/data/{year}/{output}/{year}-{output}.json', 'w') as f:  # write
            f.write(json.dumps(data, ensure_ascii=True))

    # at this point there should be files for all areas with entries for each election and schema {total, parties, seats, control, election, type}

    # GET FLIPS AND PREVIOUS ELECTION DATES
    years = ["2026", "2025", "2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]
    flips = years.copy()
    flips.reverse()
    flips = flips[:-1]  # oldest to newest excluding current year
    for i in years:
        print(f"FLIPS\t{i}\t{output}")
        results = {}  # a list of most recent results (for the given i) for all areas
        incdec = {}
        for j in flips:
            # go through each year from oldest to newest and replace any areas with the newest result
            with open(f'./public/data/{j}/{output}/{j}-{output}.json') as f:
                g = json.load(f)
                for k in g:  # build a dict of results from that year
                    results[k] = {}
                    results[k]['prev_up'] = j
                    results[k]['prev_control'] = g[k]['control']
                    results[k]['prev_comp'] = [g[k]["seats"], g[k]["parties"]]
                    incdec[k] = {}
                    incdec[k]["parties"] = g[k]["parties"]
                    incdec[k]["seats"] = g[k]["seats"]
        
        flips = flips[:-1]  # get rid of the year (remove newest year since we're getting older and older)
        year_areas = []
        flip_areas = {}
        
        with open(f'./public/data/{i}/{output}/{i}-{output}.json') as x:
            year_data = json.load(x)  # load the curent year
            for n in year_data:
                year_areas.append(n)  # create a list of all area codes from current year
                flip_areas[n] = year_data[n]['control']  # and a dict mapping area code -> control
        
        for m in year_areas:  # for every area in the LAD
            if m in results:  # if the area is in the results of previous years
                incdec[m]["incdec"] = []  # initialize the incdec
                
                # for each area, create an array of change in seats per party between the current year and the first year
                for q in range(len(incdec[m]["parties"])):
                    incdec[m]["incdec"].append(year_data[m]["seats"][year_data[m]["parties"].index(incdec[m]["parties"][q])] - incdec[m]["seats"][q])
                year_data[m]['prev_up'] = results[m]['prev_up']
                year_data[m]['prev_comp'] = createComp(results[m]['prev_comp'], year_data[m]["seats"], year_data[m]["parties"])
                year_data[m]['prev_control'] = results[m]['prev_control']
                year_data[m]['inc'] = incdec[m]["parties"][incdec[m]['incdec'].index(max(incdec[m]['incdec']))]
                year_data[m]['dec'] = incdec[m]["parties"][incdec[m]['incdec'].index(min(incdec[m]['incdec']))]
                
                if max(incdec[m]['incdec']) == 0:
                    year_data[m]['inc'] = "NOC"
                if min(incdec[m]['incdec']) == 0:
                    year_data[m]['dec'] = "NOC"
                if results[m]['prev_control'] != flip_areas[m]:  # if current control is different from old control
                    year_data[m]['change'] = "true"
                else:
                    year_data[m]['change'] = "false"

            # if the data is pre-2017 in Scotland or Wales, pre-2019 anywhere else, or 2019 and not created that year (i.e. exists but not data)
            elif (int(i) <= 2017 and m[:1] in ['S', 'W']) or (int(i) < 2019) or (int(i) == 2019 and (m not in ['E07000244', 
            'E07000246', 'E07000245', 'E06000058', ' E06000059'])) :
                year_data[m]['prev_up'] = "DATA"
                year_data[m]['prev_comp'] = "DATA"
                year_data[m]['prev_control'] = "DATA"
                year_data[m]['change'] = "DATA"
                year_data[m]['inc'] = "DATA"
                year_data[m]['dec'] = "DATA"
            # otherwise there is no data because the councils haven't had more than one election
            else:
                year_data[m]['prev_up'] = "INIT"
                year_data[m]['prev_comp'] = "INIT"
                year_data[m]['prev_control'] = "INIT"
                year_data[m]['change'] = "INIT"
                year_data[m]['inc'] = "INIT"
                year_data[m]['dec'] = "INIT"
        with open(f'./public/data/{i}/{output}/{i}-{output}.json', "w") as x:
            x.write(json.dumps(year_data, ensure_ascii=True))

    # ORDER THE SEAT COUNTS
    print(f"SORTING\t\t{output}")
    for year_data in years:
        with open(f'./public/data/{year_data}/{output}/{year_data}-{output}.json') as f:
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
        with open(f'./public/data/{year_data}/{output}/{year_data}-{output}.json', "w") as x:
            x.write(json.dumps(g, ensure_ascii=True))

generateResults("lads")
generateResults("cuas")
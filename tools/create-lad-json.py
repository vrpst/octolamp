import pandas as pd
import json


years = ["2025", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]

with open(f'./geodata/lads/lads-2019.geojson') as x:
    y = json.load(x)
    ntc_dict = {}
    for i in y['features']:
        geoname = i['properties']['LAD19NM']
        geoname = geoname.lower()
        geoname = geoname.strip()
        geoname = geoname.replace(' ','')
        geoname = geoname.replace('-','')
        geoname = geoname.replace(',countyof','')
        geoname = geoname.replace('upon','on')
        geoname = geoname.replace('kingstononhull,cityof','hull')
        ntc_dict[geoname] = i['properties']['LAD19CD']
        print(geoname)

def get2019code(lname):
    print(lname)
    lname = lname.lower()
    lname = lname.strip()
    lname = lname.replace(' ', '')        
    lname = lname.replace('-','')
    lname = lname.replace('upon','on')
    lname = lname.replace('thewrekin','wrekin')
    print(lname)
    return ntc_dict[lname]

for year in years:
    print(year)
    df = pd.read_csv(f'./csvs/lads/{year}.csv')
    data = {}

    def checkInCSV(name):
        if name in df:
            data[code]["parties"].append(name)
            data[code]["seats"].append(int(df.loc[i][name]))

    for i in range(len(df)):
        if year == "2019":
            code = get2019code(df.loc[i]['NAME'])
        else:
            code = df.loc[i]['CODE']
        data[code] = {
            "total": int(df.loc[i]['TOTAL']),
            "parties": ["CON", "LAB", "LD"],
            "seats": [int(df.loc[i]['CON']), int(df.loc[i]['LAB']), int(df.loc[i]['LD'])]
        }
        checkInCSV("GRN")
        checkInCSV("SNP")
        checkInCSV("PC")
        checkInCSV("REF")
        checkInCSV("OTH")

        if max(data[code]['seats']) > 0.5*data[code]['total']:
            data[code]['control'] = data[code]['parties'][data[code]['seats'].index(max(data[code]['seats']))]
        else:
            data[code]['control'] = "NOC"
        data[code]['election'] = year
    with open(f'./data/{year}/{year}-lads.json', 'w') as f:  # thank you stack overflow
        f.write(json.dumps(data, ensure_ascii=True))

flips = years.copy()
flips.reverse()
flips = flips[:-1]
for i in years:
    results = {}
    areas = {}
    flip_lads = {}
    for j in flips:
        print("CHECKING", j, "FOR", i)
        with open(f'./data/{j}/{j}-lads.json') as f:
            g = json.load(f)
            for k in g:
                results[k] = {}
                results[k]['prev_up'] = j
                results[k]['prev_control'] = g[k]['control']
    flips = flips[:-1]
    year_lads = []
    with open(f'./data/{i}/{i}-lads.json') as x:
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
        else:
            y[m]['prev_up'] = "INIT"
            y[m]['prev_control'] = "INIT"
            y[m]['flip'] = "INIT"

    print("WRITTEN", i)
    with open(f'./data/{i}/{i}-lads.json', "w") as x:
        x.write(json.dumps(y, ensure_ascii=True))

    print("")

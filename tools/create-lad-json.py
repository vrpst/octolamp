import pandas as pd
import json

# GET RESULTS FROM ALL BUT 2024

years = ["2025", "2023", "2022", "2021", "2018", "2017", "2016"]
for year in years:
    print(year)
    df = pd.read_csv(f'./csvs/lads/{year}.csv')
    data = {}

    def checkInCSV(name):
        if name in df:
            data[code]["parties"].append(name)
            data[code]["seats"].append(int(df.loc[i][name]))

    for i in range(len(df)):
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

year = "2024"
print(year)
df = pd.read_csv(f'./csvs/lads/{year}.csv')
data = {}

for i in range(len(df)):
    code = df.loc[i]['CODE']
    if code not in data:
        data[code] = {}
        data[code]['total'] = 0
        data[code]['parties'] = []
        data[code]['seats'] = []
    if df.loc[i]["Elected"] == "Yes":
        data[code]['total'] += 1
        pg = df.loc[i]["Party Group"]
        if df.loc[i]["Party Group"] == "IND":  # change all independents to other for now
            pg = "OTH"
        if pg not in data[code]['parties']:
            data[code]['parties'].append(pg)
            data[code]['seats'].append(0)
        print(data[code]['seats'], data[code]['parties'])
        data[code]['seats'][data[code]['parties'].index(pg)] += 1

    if max(data[code]['seats']) > 0.5*data[code]['total']:
        data[code]['control'] = data[code]['parties'][data[code]['seats'].index(max(data[code]['seats']))]
    else:
        data[code]['control'] = "NOC"
    data[code]['election'] = year
with open(f'./data/{year}/{year}-lads.json', 'w') as f:  # thank you stack overflow
    f.write(json.dumps(data, ensure_ascii=True))

# GET RESULTS FROM PREVIOUS YEARS

years = ["2025", "2024", "2023", "2022", "2021", "2018", "2017", "2016"]
flips = years.copy()
flips.reverse()
flips = flips[:-1]
results = {}
for i in years:
    areas = {}
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
    flip_lads = {}
    with open(f'./data/{i}/{i}-lads.json') as x:
        y = json.load(x)
        for n in y:
            year_lads.append(n)
            flip_lads[n] = y[n]['control']
    print("WRITING", i)
    for m in year_lads:
        y[m]['prev_up'] = results[m]['prev_up']
        y[m]['prev_control'] = results[m]['prev_control']
        if results[m]['prev_control'] != flip_lads[m]:
            y[m]['flip'] = "true"
        else:
            y[m]['flip'] = "false"
    print("WRITTEN", i)
    with open(f'./data/{i}/{i}-lads.json', "w") as x:
        x.write(json.dumps(y, ensure_ascii=True))

    print("")
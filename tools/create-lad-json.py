import pandas as pd
import json

years = ["2023", "2022", "2021", "2018", "2017", "2016"]
for year in years:
    print(year)
    df = pd.read_csv(f'./csvs/lads/{year}.csv')
    data = {}

    def checkInCSV(name):
        if name in df:
            data[code]["parties"].append(name)
            data[code]["seats"].append(int(df.loc[i][name]))

    for i in range(len(df)):
        print(df.loc[i]['CODE'])
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
    with open(f'./data/{year}/{year}-lads.json', 'w') as f:  # thank you stack overflow
        f.write(json.dumps(data, ensure_ascii=True))

# DO CHANGES, 2024, 2019
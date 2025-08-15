import pandas as pd
import json

df = pd.read_csv('local-elections-candidates-2022.csv')
data = {}

for i in range(18480):
    ward_code = df.loc[i]['Ward code']
    if ward_code not in data:
        data[ward_code] = {
            'name': df.loc[i]['Ward name'],
            'control': '',
            'county_name': df.loc[i]['COUNTYNAME'],
            'parties': {}
        }
    if df.loc[i]['Elected'] == 1:
        if df.loc[i]['Party group'] in data[ward_code]:
            data[ward_code]['parties'][df.loc[i]['Party group']] += 1
        else:
            data[ward_code]['parties'][df.loc[i]['Party group']] = 1
        #print(f"{df.loc[i]['Ward name']}\t\t\t{df.loc[i]['Ward code']}\t\t\t{df.loc[i]['Party name']}")

for j in data.keys():
    if len(data[j]['parties']) == 1:
        print(list(data[j]['parties'].keys())[0])
        data[j]['control'] = list(data[j]['parties'].keys())[0]
    else:
        data[j]['control'] = 'MIX'
#print(data)

with open('2022-simplified.json', 'a') as f:  # thank you stack overflow
    f.write(json.dumps(data, ensure_ascii=True))
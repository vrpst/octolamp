import pandas as pd
import json

df = pd.read_csv('./data/2024/2024.csv')
data = {}

for i in range(10029):
    ward_code = df.loc[i]['Ward code']
    if ward_code not in data:
        data[ward_code] = {
            'name': df.loc[i]['Ward name '],
            'control': '',
            'parties': {}
        }
    if df.loc[i]['Elected'] == "Yes":
        if df.loc[i]['Party Group'] not in data[ward_code]:
            data[ward_code]['parties'][df.loc[i]['Party Group']] = True
        #print(f"{df.loc[i]['Ward name']}\t\t\t{df.loc[i]['Ward code']}\t\t\t{df.loc[i]['Party name']}")

for j in data.keys():
    if len(data[j]['parties']) == 1:
        print(list(data[j]['parties'].keys())[0])
        data[j]['control'] = list(data[j]['parties'].keys())[0]
    else:
        data[j]['control'] = 'MIX'
    del data[j]['parties']
#print(data)

with open('./data/2024/2024-simplified.json', 'a') as f:  # thank you stack overflow
    f.write(json.dumps(data, ensure_ascii=True))
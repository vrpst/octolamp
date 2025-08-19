import pandas as pd
import json

df = pd.read_csv('./data/2023/2023.csv')
data = {}

with open(f'./data/2023/2023-results.json') as f:
    x = json.load(f)
    for i in x.keys():
        ward_code = i
        if ward_code not in data:
            data[ward_code] = {
                'name': x[i]['real_name'],
                'control': '',
            }
        elected_parties = list(x[i]['elected'].keys())
        if len(elected_parties) == 1:
            data[ward_code]['control'] = elected_parties[0]
        else:
            data[ward_code]['control'] = "MIX"

with open('./data/2023/2023-simplified.json', 'w') as f:  # thank you stack overflow
    f.write(json.dumps(data, ensure_ascii=True))
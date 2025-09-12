import pandas as pd
import json

df = pd.read_csv('./data/2022/2022.csv')
data = {}

for i in range(18480):
    ward_code = df.loc[i]['Ward code']
    if ward_code not in data:
        data[ward_code] = {
            'party_votes' : {},
            'elected': {}
        }
        data[ward_code]['total_votes'] = str(df.loc[i]['Votes'])  # if there is just one candidate, take their votes since they don't fill the total column

    try:
        data[ward_code]['party_votes'][df.loc[i]['Party group']] = str(int(df.loc[i]['Votes']) + int(data[ward_code]['party_votes'][df.loc[i]['Party group']])) # add the votes to the dict for the party
    except:
        data[ward_code]['party_votes'][df.loc[i]['Party group']] = str(df.loc[i]['Votes'])  # add the votes to the dict for the party
    if df.loc[i]['Elected'] == 1:  # add the elected members to the dict
        if df.loc[i]['Party group'] in data[ward_code]['elected']:
            data[ward_code]['elected'][df.loc[i]['Party group']] = str(int(data[ward_code]['elected'][df.loc[i]['Party group']])+1) # i hate json
        else:
            data[ward_code]['elected'][df.loc[i]['Party group']] = '1'
    if len(data[ward_code]['party_votes']) > 1:
        data[ward_code]['total_votes'] = df.loc[i][' Total valid votes '].strip()

for j in data.keys():  # change format to array of objects as needed by chart.js
    parties = []
    votes = []
    for k in data[j]['party_votes'].keys():
        parties.append(k)
        votes.append(data[j]['party_votes'][k])
    del data[j]['party_votes']
    data[j]['parties'] = parties
    data[j]['votes'] = votes
    
with open('./data/2022/2022-results.json', 'w') as f:  # thank you stack overflow
    f.write(json.dumps(data, ensure_ascii=True))
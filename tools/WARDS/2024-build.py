import pandas as pd
import json

df = pd.read_csv('./csvs/wards/2024.csv')
data = {}

def convertNum(num):
    num2 = num.strip()
    num3 = num2.replace(',','')
    if num3 == "-":
        num3 = 0
    return num3

for i in range(10029):
    ward_code = df.loc[i]['Ward code']
    if ward_code not in data:
        data[ward_code] = {
            'party_votes' : {},
            'elected': {}
        }
        data[ward_code]['total_votes'] = convertNum(df.loc[i][' Votes '])  # if there is just one candidate, take their votes since they don't fill the total column

    try:
        data[ward_code]['party_votes'][df.loc[i]['Party Group']] = str(int(convertNum(df.loc[i][' Votes '])) + int(convertNum(data[ward_code]['party_votes'][df.loc[i]['Party Group']]))) # add the votes to the dict for the party
    except:
        data[ward_code]['party_votes'][df.loc[i]['Party Group']] = convertNum(df.loc[i][' Votes ']) # add the votes to the dict for the party
    if df.loc[i]['Elected'] == "Yes":  # add the elected members to the dict
        if df.loc[i]['Party Group'] in data[ward_code]['elected']:
            data[ward_code]['elected'][df.loc[i]['Party Group']] = str(int(data[ward_code]['elected'][df.loc[i]['Party Group']])+1) # i hate json
        else:
            data[ward_code]['elected'][df.loc[i]['Party Group']] = '1'
    if len(data[ward_code]['party_votes']) > 1:
        data[ward_code]['total_votes'] = convertNum(df.loc[i][' Total votes '])

for j in data.keys():  # change format to array of objects as needed by chart.js
    parties = []
    votes = []
    for k in data[j]['party_votes'].keys():
        parties.append(k)
        votes.append(data[j]['party_votes'][k])
    del data[j]['party_votes']
    data[j]['parties'] = parties
    data[j]['votes'] = votes
    
with open('./data/2024/2024-results.json', 'a') as f:  # thank you stack overflow
    f.write(json.dumps(data, ensure_ascii=True))
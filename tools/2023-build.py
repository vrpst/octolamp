import pandas as pd
import json

def lowerify(str):
    str = str.lower()
    str = str.replace("'","")
    str = str.replace(" ","")
    str = str.replace("and","")
    str = str.replace("&","")
    str = str.replace("-","")
    str = str.replace(".","")
    str = str.replace(",","")
    str = str.replace("/","")

    return str

bb = []
df = pd.read_csv('./csvs/wards/2023.csv')
data = {}
redistricted = [] #["Basildon", "Brentwood", "Cannock Chase", "Castle Point", "Cheltenham", "Epping Forest", "Fareham", "Harlow", "Havant", "Maidstone", "North Hertfordshire", "Nuneaton and Bedworth", "Redditch", "Rossendale", "Stevenage", "Tandridge", "Tunbridge Wells", "Worcester", "Wokingham", "Dudley", "North Tyneside"]
for i in range(25697):
    if df.loc[i]['DISTRICTNAME'] in redistricted:
        pass
    else:
        d_code = df.loc[i]['DISTRICTNAME']
        ward_code = lowerify(df.loc[i]['WARDNAME']) + lowerify(df.loc[i]['DISTRICTNAME'])
        if ward_code not in data:
            bb.append(ward_code)
            data[ward_code] = {
                'party_votes' : {},
                'elected': {},
                'district': d_code
            }
            data[ward_code]['total_votes'] = str(df.loc[i]['VOTE'])  # if there is just one candidate, take their votes since they don't fill the total column
        try:
            data[ward_code]['party_votes'][df.loc[i]['PARTYGROUP']] = str(int(df.loc[i]['VOTE']) + int(data[ward_code]['party_votes'][df.loc[i]['PARTYGROUP']])) # add the votes to the dict for the party
        except:
            data[ward_code]['party_votes'][df.loc[i]['PARTYGROUP']] = str(df.loc[i]['VOTE'])  # add the votes to the dict for the party
        if df.loc[i]['WINNER'] == 1:  # add the elected members to the dict
            if df.loc[i]['PARTYGROUP'] in data[ward_code]['elected']:
                data[ward_code]['elected'][df.loc[i]['PARTYGROUP']] = str(int(data[ward_code]['elected'][df.loc[i]['PARTYGROUP']])+1) # i hate json
            else:
                data[ward_code]['elected'][df.loc[i]['PARTYGROUP']] = '1'
        if len(data[ward_code]['party_votes']) > 1:
            data[ward_code]['total_votes'] = str(df.loc[i]['EFFECTIVEVOTES'])

for j in data.keys():  # change format to array of objects as needed by chart.js
    parties = []
    votes = []
    for k in data[j]['party_votes'].keys():
        parties.append(k)
        votes.append(data[j]['party_votes'][k])
    del data[j]['party_votes']
    data[j]['parties'] = parties
    data[j]['votes'] = votes

wardict = {}
aa = []
with open('./geodata/wards/wards-2023.geojson') as f:
    d = json.load(f)
    for k in d['features']:
        x = lowerify(k['properties']['WD23NM']) + lowerify(k['properties']['LAD23NM'])
        aa.append(x)
        #if x not in data:
            #print(x, k['properties']['WD23NM'], k['properties']['LAD23NM'])
        wardict[x] = [k['properties']['WD23CD'], k['properties']['WD23NM'], k['properties']['LAD23NM']]
aa.sort()
bb.sort()
cc = []
for i in range(len(bb)):
    if bb[i] not in aa:
        cc.append(bb[i])
print(cc)
dd = {}
for m in data.keys():
    if m in wardict.keys():
        dd[wardict[m][0]] = data[m]
        dd[wardict[m][0]]['name'] = wardict[m][1]

    #dd[wardict[y][0]]['csv_name'] = m

with open('./data/2023/2023-results.json', 'w') as f:  # thank you stack overflow
    f.write(json.dumps(dd, ensure_ascii=True))
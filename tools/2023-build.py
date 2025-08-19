import pandas as pd
import json

df = pd.read_csv('./data/2023/2023.csv')
data = {}
redistricted = ["Basildon", "Brentwood", "Cannock Chase", "Castle Point", "Cheltenham", "Epping Forest", "Fareham", "Harlow", "Havant", "Maidstone", "North Hertfordshire", "Nuneaton and Bedworth", "Redditch", "Rossendale", "Stevenage", "Tandridge", "Tunbridge Wells", "Worcester", "Wokingham", "Dudley", "North Tyneside"]
for i in range(25697):
    if df.loc[i]['DISTRICTNAME'] in redistricted:
        pass
    else:
        ward_code = df.loc[i]['WARDNAME']
        if ward_code not in data:
            data[ward_code] = {
                'party_votes' : {},
                'elected': {}
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
with open('./wards.geojson') as f:
    d = json.load(f)
    for k in d['features']:
        x = k['properties']['WD24NM'].lower()
        x = x.replace(',','')  # get rid of commas since they wont be in the csv
        x = x.replace('.','')  # get rid of commas since they wont be in the csv
        x = x.replace("'",'')  # get rid of commas since they wont be in the csv
        if x == "campbell park & old woughton":  # MAKE UP YOUR MIND IS IT A DAMN AMPERSAND OR NOT
            print("aaaaaaa")
        wardict[x] = [k['properties']['WD24CD'], k['properties']['WD24NM']]

dd = {}
for m in data.keys():
    try:
        y = m.lower()
        y = y.replace(',','')
        y = y.replace('.','')
        y = y.replace("'",'')
        if m == "Campbell Park and Old Wroughton":
            y = "campbell park & old woughton"  # MAKE UP YOUR MIND IS IT A DAMN AMPERSAND OR NOT
        elif m == "Burnham On Crouch North":
            y = "burnham-on-crouch north"  # MAKE UP YOUR MIND IS IT A DAMN AMPERSAND OR NOT
        elif m == "Burnham On Crouch South":
            y = "burnham-on-crouch south"  # MAKE UP YOUR MIND IS IT A DAMN AMPERSAND OR NOT
        elif m == "Flitch Green Little Dunmow":
            y = "flitch green & little dunmow"
        elif m == "Snaith/Airmyn & Rawcliffe & Marshland":
            y = "snaith airmyn rawcliffe and marshland"
        elif m == "St Andrew's & Dockland":
            y = "st andrews & docklands"
        elif m == "Broughton Astley - Primethorpe & Sutton":
            y = "broughton astley-primethorpe & sutton"
        elif m == "Market Harborough - Great Bowden & Arden":
            y = "market harborough-great bowden & arden"
        elif m == "Holton Le Clay & North Thoresby":
            y = "holton-le-clay & north thoresby"
        elif m == "Scarborough & Seacroft":
            y = "scarbrough & seacroft"
        elif m == "GAINSBOROUGH SOUTH WEST":
            y = "gainsborough south-west"
        elif m == "Birchills-Leamore":
            y = "birchills leamore"
        dd[wardict[y][0]] = data[m]
    except:
        try:
            if " and " in y:
                y = y.replace('and','&')  # the line of code exists because the british government cannot decide how to use ampersands
            elif " & " in y:
                y = y.replace('&','and')
            elif "." in y:
                y = y.replace('.','')
            elif y[-1] == "s":
                y = y[:-1] + "'s"
            elif " - " in y:
                y = y.replace(" - ", "-")
            dd[wardict[y][0]] = data[m]
        except KeyError as e:
            print(e)
    dd[wardict[y][0]]['csv_name'] = m
    dd[wardict[y][0]]['real_name'] = wardict[y][1]

with open('./data/2023/2023-results.json', 'a') as f:  # thank you stack overflow
    f.write(json.dumps(dd, ensure_ascii=True))
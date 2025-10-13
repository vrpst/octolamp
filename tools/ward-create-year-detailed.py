import pandas as pd
import json


def get2023Code(thing):
    thing = thing.lower()
    thing = thing.replace(' ', '')
    thing = thing.replace('-','')
    thing = thing.replace("'","")
    thing = thing.replace(".","")
    thing = thing.replace("/","")
    thing = thing.replace("&","")
    thing = thing.replace("and","")
    thing = thing.replace("upon","on")
    thing = thing.replace(",","")
    thing = thing.replace("countyof","")
    thing = thing.replace("cityof","")
    thing = thing.replace("the","")
    thing = thing.replace("kingstonon","")
    return thing

def fixnum(t):
    t = str(t)
    t = t.strip()
    t = t.replace(',','')
    t = t.replace("-","0")
    t = int(t)
    return t

with open(f'./public/geodata/wards/wards-2023.geojson', ) as g2:  # thank you stack overflow
    geo = json.load(g2)      
    geo = geo['features']
    hash23 = {}
    hash23lads = {}
    for i in geo:
        hash23[get2023Code(i["properties"]["WD23NM"]+i["properties"]["LAD23NM"])] = i["properties"]["WD23CD"]
    with open(f'./public/geodata/lads/lads-2023.geojson', ) as g3:  # thank you stack overflow
        g4 = json.load(g3)
        g4 = g4["features"]
        for j in g4:
            hash23lads[get2023Code(j["properties"]["LAD23NM"])] = j["properties"]["LAD23CD"]
def generateResults(output):
    years = ["2024", "2023", "2022", "2021"]
    for year in years:
        print(year)
        df = pd.read_csv(f'./csvs/wards/{year}.csv')
        data = {}
        for i in range(len(df)):
            if year == "2023":
                code = hash23[get2023Code(df.loc[i]["NAME"]+df.loc[i]["LACNAME"])]
            else: 
                code = df.loc[i]["CODE"]
            if code not in list(data.keys()):
                data[code] = {
                    "table_data": [],
                    "elected": {},
                    "total_votes": 0,
                    "parties": [],
                    "contested": [],
                    "votes": [],
                    "lad_code": "",
                    "election": year,
                    "seats_up": 0,
                    "control": ""
                }
            data[code]["table_data"].append([df.loc[i]["PARTYGROUP"], df.loc[i]["CANDNAME"], int(fixnum(df.loc[i]["VOTES"]))])
            data[code]["total_votes"] += int(fixnum(df.loc[i]["VOTES"]))
            if df.loc[i]["ELECTED"] in ["Yes", 1]:
                data[code]["table_data"][-1].append(1)
                data[code]["seats_up"] += 1
                if df.loc[i]["PARTYGROUP"] in data[code]["elected"].keys():
                    data[code]["elected"][df.loc[i]["PARTYGROUP"]] += 1
                else:
                    data[code]["elected"][df.loc[i]["PARTYGROUP"]] = 1
            else:
                data[code]["table_data"][-1].append(0)
            if df.loc[i]["PARTYGROUP"] in data[code]["parties"]:
                data[code]["votes"][data[code]["parties"].index(df.loc[i]["PARTYGROUP"])] += int(fixnum(df.loc[i]["VOTES"]))
                data[code]["contested"][data[code]["parties"].index(df.loc[i]["PARTYGROUP"])] += 1
            else:
                data[code]["parties"].append(df.loc[i]["PARTYGROUP"])
                data[code]["votes"].append(int(fixnum(df.loc[i]["VOTES"])))
                data[code]["contested"].append(1)
            if year == "2023":
                data[code]["lad_code"] = hash23lads[get2023Code(df.loc[i]["LACNAME"])] 
            else:
                data[code]["lad_code"] = df.loc[i]["LACCODE"]
            if len(data[code]["elected"].keys()) > 1:
                    data[code]["control"] = "NOC"
            else:
                data[code]["control"] = list(data[code]["elected"].keys())[0]
        with open(f'./public/data/{year}/{output}/{year}-{output}.json', 'w') as f:  # thank you stack overflow
            f.write(json.dumps(data, ensure_ascii=True))

generateResults("wards")
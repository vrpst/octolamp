import pandas as pd
import json


def getCode(thing):
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

with open('./public/geodata/wards/wards-2023.geojson', ) as g2:  # thank you stack overflow
    geo = json.load(g2)      
    geo = geo['features']
    hash23 = {}
    hash23lads = {}
    for i in geo:
        hash23[getCode(i["properties"]["WD23NM"]+i["properties"]["LAD23NM"])] = i["properties"]["WD23CD"]
    with open('./public/geodata/lads/lads-2023.geojson', ) as g3:  # thank you stack overflow
        g4 = json.load(g3)
        g4 = g4["features"]
        for j in g4:
            hash23lads[getCode(j["properties"]["LAD23NM"])] = j["properties"]["LAD23CD"]
with open('./public/geodata/wards/wards-2025.geojson', ) as g2:  # thank you stack overflow
    geo25 = json.load(g2)      
    geo25 = geo25['features']
def generateResults(output):
    years = ["2025", "2024", "2023", "2022", "2021"]
    for year in years:
        print(year)
        df = pd.read_csv(f'./csvs/wards/{year}.csv')
        data = {}
        for i in range(len(df)):
            if year == "2023":
                code = hash23[getCode(df.loc[i]["NAME"]+df.loc[i]["LACNAME"])]
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
            if df.loc[i]["ELECTED"] in ["Yes", 1, "TRUE"]:
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
                data[code]["lad_code"] = hash23lads[getCode(df.loc[i]["LACNAME"])] 
            elif year == "2025":
                for feature in geo25:
                    if feature["properties"]["WD25CD"] == code:
                        data[code]["lad_code"] = feature["properties"]["LAD25CD"]
                        continue
            else:
                data[code]["lad_code"] = df.loc[i]["LACCODE"]

        for code in data.keys():
            if len(data[code]["elected"].keys()) > 1:
                data[code]["control"] = "NOC"
            else:
                data[code]["control"] = list(data[code]["elected"].keys())[0]
            # sort table
            new_table = sorted(data[code]["table_data"], key=lambda x: x[2], reverse=True)
            data[code]["table_data"] = new_table
            old = []
            for p in range(len(data[code]["parties"])):
                old.append((data[code]["parties"][p], data[code]["contested"][p], data[code]["votes"][p]))
            old = sorted(old, key=lambda x: x[2]/x[1], reverse=True)
            data[code]["parties"] = [item[0] for item in old]
            data[code]["contested"] = [item[1] for item in old]
            data[code]["votes"] = [item[2] for item in old]
        with open(f'./public/data/{year}/{output}/{year}-{output}.json', 'w') as f:  # thank you stack overflow
            f.write(json.dumps(data, ensure_ascii=True))

generateResults("wards")
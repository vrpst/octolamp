## UNUSED ##

import json
for i in ["cuas", "lads"]:
    for j in ["2025", "2024", "2023", "2022", "2021", "2019", "2018", "2017", "2016"]:
        with open(f"./public/data/{j}/{i}/{j}-{i}.json", "r") as file:
            year_data = json.load(file)
        control = {}
        data = {}
        for k in year_data:
            if year_data[k]["control"] not in control:
                control[year_data[k]["control"]] = 0
            control[year_data[k]["control"]] += 1
        print(i, j, control)
        data[j] = {
            "total" : 0,
            "parties": [],
            "seats": []
        }
        for m in control.keys():
            if m not in data[j]["parties"]:
                data[j]["parties"].append(m)
                data[j]["seats"].append(0)
            data[j]["seats"][data[j]["parties"].index(m)] += control[m]
            data[j]["total"] += control[m]
        print(data)
        with open(f"./public/data/{j}/{i}/{j}-overview.json", "w") as file2:
            file2.write(json.dumps(data, ensure_ascii=True))
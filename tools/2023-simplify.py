import json
y = 23
data = {}
with open(f'./data/20{y}/20{y}-results.json') as f:
    f = json.load(f)
    for i in f.keys():
        print(list(f.keys()).index(i), len(f.keys()))
        if len(f[i]['elected'].keys()) == 1:
            control = list(f[i]['elected'].keys())[0]
        else:
            control = "MIX"
        data[i] = {
            'name': f[i]['name'],
            'control': control
        }

with open(f'./data/20{y}/20{y}-simplified.json', 'w') as m:
    m.write(json.dumps(data, ensure_ascii=True))


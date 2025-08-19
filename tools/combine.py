import json

def combine(typ):
    x = []
    y = {}
    for i in range(2022,2024):
        with open(f'./data/{i}/{i}-{typ}.json') as f:
            x.append(json.load(f))

    for j in x:
        for k in j.keys():
            y[k] = j[k]
    with open(f'./data/{typ}.json', 'w') as g:  # thank you stack overflow
        g.write(json.dumps(y, ensure_ascii=True))

combine('results')
combine('simplified')
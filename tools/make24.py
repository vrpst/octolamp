import csv
with open("./csvs/test", 'r') as f:
    h = f.readlines()
    g = h.copy()
    for i in range(len(g)):
        g[i] = g[i].replace("seats won","seatswon")
        if "(" in g[i]:  # make sure two-word places aren't removed
            g[i] = g[i].replace(' ','')
            g[i] = g[i].replace('(', ' (')
        g[i] = g[i].replace(' ',',')
        g[i] = g[i].replace('\n','')
        g[i] = g[i].upper()
        g[i] = g[i].split(',')
    new1 = []
    for i in range(len(g)):
        if len(g[i]) == 2:
            new1.append([g[i][0]])
            new1.append("a,a,a,a,a,a,a")
print(new1)
new2 = [["NAME", "TYPE", "CON", "LAB", "LD", "GREEN", "REF", "IND", "OTH"]]
counciltype = "M"
for i in range(len(new1)):
    if new1[i][0] == "ADUR":
        counciltype = "D"
    elif new1[i][0] == "BLACKBURNWITHDARWEN":
        counciltype = "U"

    if i % 2 == 0:
        new1[i+1] = [new1[i][0].lower() + ',' + counciltype + ',' + new1[i+1]]
    else:
        new2.append(new1[i])
print(new2, len(new2))

with open("./csvs/test.csv","w") as my_csv:
    csvWriter = csv.writer(my_csv,delimiter=',')
    csvWriter.writerows(new2)
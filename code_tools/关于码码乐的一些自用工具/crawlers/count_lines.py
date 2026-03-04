import csv

filename = "520ai_apps_all.csv"

with open(filename, "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    lines = list(reader)
    print(f"文件 {filename} 共有 {len(lines)} 行数据")
    print(f"其中包括 {len(lines) - 1} 条应用记录")

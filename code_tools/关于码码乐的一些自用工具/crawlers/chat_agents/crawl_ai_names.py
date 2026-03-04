import requests
import json
import csv

# API基础信息
BASE_URL = "https://3w-api.mamale.vip/api/app/aiSetCategory/public"

def get_ai_names():
    """获取所有AI分类和模型的name和fullName字段"""
    all_items = []
    
    print("开始获取AI分类和模型数据...")
    
    try:
        # 第一步：获取一级分类
        params = {
            "status": 1,
            "pageIndex": 1,
            "pageSize": 100,
            "LevelMin": 0,
            "LevelMax": 1
        }
        
        print("获取一级分类...")
        response = requests.get(BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        
        level1_data = response.json()
        level1_categories = level1_data.get("items", [])
        
        print(f"找到 {len(level1_categories)} 个一级分类")
        
        # 保存一级分类的name和fullName
        for category in level1_categories:
            name = category.get("name", "")
            full_name = category.get("fullName", name)  # 如果没有fullName，使用name
            if name:
                all_items.append({"name": name, "fullName": full_name})
                print(f"一级分类: name='{name}', fullName='{full_name}'")
            
            # 第二步：获取每个一级分类下的二级分类
            category_id = category.get("id", "")
            if category_id:
                level2_params = {
                    "status": 1,
                    "pageIndex": 1,
                    "pageSize": 100,
                    "ParentId": category_id
                }
                
                print(f"获取 '{name}' 分类下的二级分类...")
                level2_response = requests.get(BASE_URL, params=level2_params, timeout=30)
                level2_response.raise_for_status()
                
                level2_data = level2_response.json()
                level2_categories = level2_data.get("items", [])
                
                print(f"找到 {len(level2_categories)} 个二级分类")
                
                # 保存二级分类的name和fullName，以及其中的AI模型name和fullName
                for level2_category in level2_categories:
                    level2_name = level2_category.get("name", "")
                    level2_full_name = level2_category.get("fullName", level2_name)
                    if level2_name:
                        all_items.append({"name": level2_name, "fullName": level2_full_name})
                        print(f"二级分类: name='{level2_name}', fullName='{level2_full_name}'")
                    
                    # 获取该二级分类下的AI模型
                    ai_sets = level2_category.get("aiSets", [])
                    print(f"找到 {len(ai_sets)} 个AI模型")
                    
                    for ai_set in ai_sets:
                        ai_name = ai_set.get("name", "")
                        # AI模型没有fullName，使用二级分类的fullName加上模型名
                        ai_full_name = f"{level2_full_name}-{ai_name}"
                        if ai_name:
                            all_items.append({"name": ai_name, "fullName": ai_full_name})
                            print(f"AI模型: name='{ai_name}', fullName='{ai_full_name}'")
        
        # 去重，根据name字段
        unique_items = []
        seen_names = set()
        for item in all_items:
            if item["name"] not in seen_names:
                seen_names.add(item["name"])
                unique_items.append(item)
        
        # 按fullName排序
        unique_items.sort(key=lambda x: x["fullName"])
        
        print(f"\n共获取到 {len(unique_items)} 个唯一的项目")
        for item in unique_items:
            print(f"name='{item['name']}', fullName='{item['fullName']}'")
        
        # 保存到CSV文件
        with open("ai_names.csv", "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["name", "fullName"])
            for item in unique_items:
                writer.writerow([item["name"], item["fullName"]])
        print("\n数据已保存到 ai_names.csv 文件")
        
        return unique_items
        
    except requests.exceptions.RequestException as e:
        print(f"请求时出错: {e}")
        return []
    except Exception as e:
        print(f"处理数据时出错: {e}")
        return []

def main():
    get_ai_names()

if __name__ == "__main__":
    main()
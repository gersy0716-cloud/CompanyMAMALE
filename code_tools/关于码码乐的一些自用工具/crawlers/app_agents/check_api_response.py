import requests
import json

# API基础信息
BASE_URL = "https://3w-api.mamale.vip/api/app/aiSetCategory/public"

def check_api_structure():
    """检查API返回的数据结构"""
    
    print("检查API返回的数据结构...")
    
    # 获取一级分类
    params = {
        "status": 1,
        "pageIndex": 1,
        "pageSize": 10,
        "LevelMin": 0,
        "LevelMax": 1
    }
    
    response = requests.get(BASE_URL, params=params, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    
    # 保存完整响应
    with open("api_response.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("API响应已保存到 api_response.json 文件")
    
    # 查看第一个一级分类的结构
    if data.get("items"):
        level1 = data["items"][0]
        print(f"\n一级分类数据结构:")
        print(json.dumps(level1, ensure_ascii=False, indent=2))
        
        # 获取该一级分类下的二级分类
        category_id = level1.get("id", "")
        if category_id:
            level2_params = {
                "status": 1,
                "pageIndex": 1,
                "pageSize": 10,
                "ParentId": category_id
            }
            
            level2_response = requests.get(BASE_URL, params=level2_params, timeout=30)
            level2_response.raise_for_status()
            
            level2_data = level2_response.json()
            
            # 保存二级分类响应
            with open("level2_api_response.json", "w", encoding="utf-8") as f:
                json.dump(level2_data, f, ensure_ascii=False, indent=2)
            
            print("\n二级分类API响应已保存到 level2_api_response.json 文件")
            
            # 查看第一个二级分类的结构
            if level2_data.get("items"):
                level2 = level2_data["items"][0]
                print(f"\n二级分类数据结构:")
                print(json.dumps(level2, ensure_ascii=False, indent=2))
                
                # 查看AI模型的结构
                if level2.get("aiSets"):
                    ai_set = level2["aiSets"][0]
                    print(f"\nAI模型数据结构:")
                    print(json.dumps(ai_set, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    check_api_structure()
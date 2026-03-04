import requests
import csv
import time

# API基础信息
BASE_URL = "https://3w-api.mamale.vip/api/app/aiApplication/public"
INITIAL_PARAMS = {
    "Sorting": "sortId desc",
    "pageIndex": 1,
    "pageSize": 100,  # 每页获取100条，减少请求次数
    "title": "",
    "SearchType": 1,
    "status": 1
}

def get_applications():
    """获取所有应用数据"""
    all_apps = []
    page_index = 1
    total_count = 0
    
    print("开始获取应用数据...")
    
    while True:
        # 设置当前页码
        params = INITIAL_PARAMS.copy()
        params["pageIndex"] = page_index
        
        try:
            print(f"获取第 {page_index} 页数据...")
            response = requests.get(BASE_URL, params=params, timeout=30)
            response.raise_for_status()  # 检查请求是否成功
            
            data = response.json()
            
            # 第一次请求时获取总数量
            if page_index == 1:
                total_count = data.get("totalCount", 0)
                print(f"总共有 {total_count} 个应用")
            
            # 获取当前页的应用列表
            apps = data.get("items", [])
            if not apps:
                print("没有更多数据了")
                break
            
            print(f"第 {page_index} 页获取到 {len(apps)} 个应用")
            all_apps.extend(apps)
            
            # 检查是否已获取所有数据
            if len(all_apps) >= total_count:
                print(f"已获取所有数据，共 {len(all_apps)} 个应用")
                break
            
            # 增加页码
            page_index += 1
            
            # 延迟请求，避免过快请求导致被封禁
            time.sleep(1)
            
        except requests.exceptions.RequestException as e:
            print(f"请求时出错: {e}")
            break
        except Exception as e:
            print(f"处理数据时出错: {e}")
            break
    
    return all_apps

def save_to_csv(apps, filename="520ai_apps_all.csv"):
    """将应用数据保存到CSV文件"""
    if not apps:
        print("没有数据可以保存")
        return
    
    print(f"保存 {len(apps)} 个应用到 {filename}...")
    
    # 定义CSV列名
    fieldnames = ["content", "author"]
    
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        
        for app in apps:
            # 获取应用标题和作者
            title = app.get("title", "")
            author = app.get("author", "")
            
            # 写入一行数据
            writer.writerow([title, author])
    
    print(f"数据已成功保存到 {filename}")

def main():
    """主函数"""
    # 获取所有应用数据
    apps = get_applications()
    
    if apps:
        # 保存到CSV文件
        save_to_csv(apps)
        print(f"爬取完成，共获取到 {len(apps)} 个应用")
    else:
        print("未获取到任何应用数据")

if __name__ == "__main__":
    main()
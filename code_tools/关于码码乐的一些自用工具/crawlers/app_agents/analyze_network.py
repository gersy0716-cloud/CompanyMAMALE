from playwright.sync_api import sync_playwright
import json

url = "https://www.520ai.cc/ai/#/composite/app"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 启用网络请求拦截
        api_requests = []
        
        def log_request(route, request):
            url = request.url
            method = request.method
            if method in ["GET", "POST"] and (".json" in url or "/api/" in url or "/data/" in url or "composite" in url):
                api_requests.append({
                    "url": url,
                    "method": method,
                    "headers": request.headers
                })
                print(f"API请求: {method} {url}")
            route.continue_()
        
        def log_response(response):
            url = response.url
            if ".json" in url or "/api/" in url or "/data/" in url or "composite" in url:
                try:
                    status = response.status
                    data = response.json()
                    print(f"API响应: {status} {url}")
                    print(f"响应数据: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}...")
                    # 保存响应数据
                    with open(f"response_{len(api_requests)}.json", "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    print(f"解析响应时出错: {e}")
        
        page.route("**/*", log_request)
        page.on("response", log_response)
        
        print("开始加载页面...")
        page.goto(url, wait_until="load", timeout=60000)
        page.wait_for_timeout(5000)
        
        # 滚动到页面底部
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(3000)
        
        # 点击"更多"按钮
        try:
            btn = page.get_by_text("更多", exact=False).first
            if btn.is_visible():
                print("点击更多按钮")
                btn.click()
                page.wait_for_timeout(8000)
        except Exception as e:
            print(f"点击更多按钮时出错: {e}")
        
        # 保存API请求列表
        with open("api_requests.json", "w", encoding="utf-8") as f:
            json.dump(api_requests, f, ensure_ascii=False, indent=2)
        
        print(f"\n共监控到 {len(api_requests)} 个API请求")
        browser.close()

if __name__ == "__main__":
    main()
from playwright.sync_api import sync_playwright
import json

url = "https://www.520ai.cc/ai/#/ai-set/process"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # 启用网络请求拦截
        api_requests = []
        
        def log_request(route, request):
            url = request.url
            method = request.method
            if method in ["GET", "POST"] and (".json" in url or "/api/" in url or "/data/" in url or "process" in url or "aiSet" in url or "login" in url):
                api_requests.append({
                    "url": url,
                    "method": method,
                    "headers": request.headers
                })
                print(f"API请求: {method} {url}")
            route.continue_()
        
        def log_response(response):
            url = response.url
            if ".json" in url or "/api/" in url or "/data/" in url or "process" in url or "aiSet" in url or "login" in url:
                try:
                    status = response.status
                    data = response.json()
                    print(f"API响应: {status} {url}")
                    print(f"响应数据: {json.dumps(data, ensure_ascii=False, indent=2)[:800]}...")
                    # 保存响应数据
                    with open(f"new_page_response_{len(api_requests)}.json", "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    print(f"解析响应时出错: {e}")
        
        page.route("**/*", log_request)
        page.on("response", log_response)
        
        print("开始加载页面...")
        page.goto(url, wait_until="load", timeout=60000)
        page.wait_for_timeout(5000)
        
        # 检查是否需要登录
        if "login" in page.url.lower() or "登录" in page.content():
            print("页面需要登录，尝试自动登录...")
            
            # 输入用户名
            try:
                username_input = page.locator("input[placeholder='请输入登录账号']").first
                if username_input.is_visible():
                    print("输入用户名")
                    username_input.fill("luowenbin")
            except Exception as e:
                print(f"输入用户名时出错: {e}")
            
            # 输入密码
            try:
                password_input = page.locator("input[placeholder='请输入密码']").first
                if password_input.is_visible():
                    print("输入密码")
                    password_input.fill("123654")
            except Exception as e:
                print(f"输入密码时出错: {e}")
            
            # 点击登录按钮
            try:
                login_button = page.locator(".login-bottom").first
                if login_button.is_visible():
                    print("点击登录按钮")
                    login_button.click()
                    page.wait_for_timeout(8000)  # 等待登录完成
            except Exception as e:
                print(f"点击登录按钮时出错: {e}")
        
        # 检查登录是否成功
        if "login" not in page.url.lower() and "登录" not in page.content():
            print("登录成功")
            
            # 滚动到页面底部
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(3000)
            
            # 保存API请求列表
            with open("new_page_api_requests.json", "w", encoding="utf-8") as f:
                json.dump(api_requests, f, ensure_ascii=False, indent=2)
            
            print(f"\n共监控到 {len(api_requests)} 个API请求")
            
            # 保存页面内容
            with open("new_page_content.html", "w", encoding="utf-8") as f:
                f.write(page.content())
            print("页面内容已保存到 new_page_content.html")
        else:
            print("登录失败或页面仍需要登录")
            
        browser.close()

if __name__ == "__main__":
    main()
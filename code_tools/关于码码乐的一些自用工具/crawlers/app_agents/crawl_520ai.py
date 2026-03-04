from playwright.sync_api import sync_playwright
import csv
import time

url = "https://www.520ai.cc/ai/#/composite/app"

def click_load_more_until_end(page, max_rounds=150, wait_ms=5000):
    # 初始加载后等待更长时间确保内容完全显示
    page.wait_for_timeout(5000)
    
    # 获取初始应用数量
    initial_count = page.locator("div.item").count()
    print(f"初始应用数量：{initial_count}")
    
    previous_count = initial_count
    no_increase_count = 0  # 记录数量未增加的次数
    
    for i in range(max_rounds):
        try:
            # 先滚动到页面底部，确保加载更多按钮可见
            print(f"第{i+1}轮：滚动到页面底部")
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)  # 增加滚动后等待时间
            
            # 尝试多种方式查找"更多"按钮
            btn = None
            found = False
            
            # 方式1：按文本查找（精确匹配）
            try:
                btn = page.get_by_text("更多", exact=True).first
                if btn.is_visible():
                    found = True
            except:
                pass
            
            # 方式2：按文本查找（包含"更多"）
            if not found:
                try:
                    btn = page.get_by_text("更多", exact=False).first
                    if btn.is_visible():
                        found = True
                except:
                    pass
            
            # 方式3：按类名查找
            if not found:
                try:
                    btn = page.locator(".center-bottom").first
                    if btn.is_visible():
                        found = True
                except:
                    pass
            
            # 方式4：按包含"更多"的元素查找
            if not found:
                try:
                    btn = page.locator("span:has-text('更多')").first
                    if btn.is_visible():
                        found = True
                except:
                    pass
            
            # 方式5：按选择器查找（更广泛的匹配）
            if not found:
                try:
                    btn = page.locator("*:has-text('更多')").first
                    if btn.is_visible():
                        found = True
                except:
                    pass
            
            if not found or not btn or not btn.is_visible():
                print(f"第{i+1}轮：未找到可见的更多按钮")
                # 截图以便分析页面状态
                page.screenshot(path=f"screenshot_round_{i+1}.png")
                print(f"第{i+1}轮：已保存页面截图到 screenshot_round_{i+1}.png")
                break
            
            # 获取按钮位置，确保点击正确
            btn_bounding_box = btn.bounding_box()
            if btn_bounding_box:
                # 点击按钮中心位置
                print(f"第{i+1}轮：点击更多按钮（位置：x={btn_bounding_box['x']}, y={btn_bounding_box['y']}）")
                page.mouse.click(btn_bounding_box['x'] + btn_bounding_box['width'] / 2, 
                               btn_bounding_box['y'] + btn_bounding_box['height'] / 2)
            else:
                # 回退到普通点击
                print(f"第{i+1}轮：点击更多按钮")
                btn.click()
            
            # 增加等待时间，确保新内容完全加载
            print(f"第{i+1}轮：等待 {wait_ms} 毫秒加载新内容")
            page.wait_for_timeout(wait_ms)
            
            # 再次滚动到页面底部
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)
            
            # 点击后检查数量变化
            current_count = page.locator("div.item").count()
            print(f"第{i+1}轮：点击后应用数量从 {previous_count} 增加到 {current_count}")
            
            # 如果数量增加了
            if current_count > previous_count:
                print(f"第{i+1}轮：成功加载 {current_count - previous_count} 个新应用")
                previous_count = current_count
                no_increase_count = 0  # 重置未增加计数
            
            # 如果数量不再增加
            else:
                no_increase_count += 1
                print(f"第{i+1}轮：应用数量未增加，连续 {no_increase_count} 次")
                
                # 如果连续5次数量未增加，停止加载
                if no_increase_count >= 5:
                    print(f"第{i+1}轮：应用数量连续5次未增加，停止加载")
                    # 截图以便分析页面状态
                    page.screenshot(path=f"screenshot_final.png")
                    print(f"最终页面截图已保存到 screenshot_final.png")
                    break
                # 否则继续尝试，增加等待时间
                else:
                    print(f"第{i+1}轮：继续尝试加载更多内容，增加等待时间")
                    # 额外等待一段时间
                    page.wait_for_timeout(2000)
            
        except Exception as e:
            print(f"第{i+1}轮：点击更多按钮时出错: {e}")
            # 尝试恢复：滚动到页面底部并等待
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(3000)
            continue
    
    final_count = page.locator("div.item").count()
    print(f"最终加载到 {final_count} 个应用")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # 恢复headless模式
        page = browser.new_page()
        page.goto(url, wait_until="load", timeout=60000)
        page.wait_for_timeout(8000)  # 等待页面完全加载

        click_load_more_until_end(page)

        # 使用正确的选择器定位应用卡片
        cards = page.locator("div.item")
        count = cards.count()
        print(f"共找到 {count} 个应用卡片")

        rows = []
        for i in range(count):
            card = cards.nth(i)
            try:
                title = card.locator(".item-title").inner_text().strip()
                author = card.locator(".item-info").inner_text().strip()
                rows.append([title, author])
            except Exception as e:
                print(f"处理卡片 {i+1} 时出错: {e}")

        browser.close()

    if rows:
        with open("520ai_apps.csv", "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["content", "author"])
            writer.writerows(rows)
        print(f"成功爬取 {len(rows)} 条记录，已保存到520ai_apps.csv")
    else:
        print("未收集到任何记录")

if __name__ == "__main__":
    main()
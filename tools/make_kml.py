import requests
import simplekml
import os
from datetime import datetime
from dotenv import load_dotenv

# 讀取環境變數
load_dotenv(dotenv_path='roadwork_tracker/.env')

# 配置區
# 建議將 API KEY 放在 roadwork_tracker/.env 中
API_KEY = os.getenv("STREET_MANAGER_API_KEY", "YOUR_API_KEY_HERE")
BBOX = "-0.385,51.721,-0.301,51.785" # St Albans AL1-AL4 範圍
API_URL = f"https://api.street-manager.service.gov.uk/v1/works?bbox={BBOX}"
OUTPUT_FILE = "roadworks_stalbans.kml"

def fetch_data():
    print(f"正在從 Street Manager API 抓取 AL1-AL4 資料...")
    headers = {"X-API-Key": API_KEY}
    try:
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"抓取失敗: {e}")
        return None

def create_kml(data):
    if not data or 'works' not in data:
        print("未發現有效的工程資料。")
        return

    kml = simplekml.Kml(name="St Albans Live Roadworks (AL1-AL4)")

    # 定義樣式
    style_closure = simplekml.Style()
    style_closure.iconstyle.icon.href = "http://maps.google.com/mapfiles/kml/paddle/red-circle.png"
    style_closure.iconstyle.scale = 1.1

    style_work = simplekml.Style()
    style_work.iconstyle.icon.href = "http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png"
    style_work.iconstyle.scale = 0.9

    works = data.get('works', [])
    print(f"找到 {len(works)} 個工程項目，正在處理...")

    for work in works:
        try:
            lon = work.get('longitude')
            lat = work.get('latitude')
            if lon is None or lat is None: continue

            # 判斷是否為封路 (Closure)
            desc = work.get('description', '')
            work_type = work.get('work_type', '')
            is_closure = any(word in str(desc).lower() or word in str(work_type).lower()
                             for word in ['closure', 'closed', 'fully closed', 'road closed'])

            pnt = kml.newpoint(name=f"{work.get('street', 'Roadwork')}")
            pnt.coords = [(lon, lat)]

            # 建立豐富的 HTML 描述 (適合手機查看)
            status_tag = "<b style='color:red;'>🔴 封路 (Closure)</b>" if is_closure else "<b style='color:orange;'>🟡 施工中</b>"

            pnt.description = (
                f"<![CDATA["
                f"<div style='font-family:sans-serif; min-width:200px;'>"
                f"<h3>{work.get('street', '未知街道')}</h3>"
                f"<p>{status_tag}</p>"
                f"<hr/>"
                f"<b>類型:</b> {work.get('work_type', 'N/A')}<br/>"
                f"<b>說明:</b> {desc or '無詳細說明'}<br/>"
                f"<b>日期:</b> {work.get('start_date', '?')} 至 {work.get('end_date', '?')}<br/>"
                f"<b>編號:</b> {work.get('work_reference', 'N/A')}<br/>"
                f"<hr/>"
                f"<p style='font-size:10px; color:gray;'>小敏 (SzeMan) 自動生成於 {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>"
                f"</div>"
                f"]]> "
            )

            # 套用樣式
            pnt.style = style_closure if is_closure else style_work

        except Exception as e:
            print(f"處理項目時出錯: {e}")

    kml.save(OUTPUT_FILE)
    print(f"成功！已生成檔案: {OUTPUT_FILE}")

if __name__ == "__main__":
    if API_KEY == "YOUR_API_KEY_HERE":
        print("錯誤：請在腳本中或 .env 檔案中設定 STREET_MANAGER_API_KEY")
    else:
        data = fetch_data()
        if data:
            create_kml(data)

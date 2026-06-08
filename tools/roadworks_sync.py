import requests
import simplekml
import os
from datetime import datetime

# 配置區
# 注意：你需要到 https://www.street-manager.service.gov.uk/ 申請 API Key
API_KEY = os.getenv("STREET_MANAGER_API_KEY", "YOUR_API_KEY_HERE")
BBOX = "-0.385,51.721,-0.301,51.785" # St Albans AL1-AL4
API_URL = f"https://api.street-manager.service.gov.uk/v1/works?bbox={BBOX}"
OUTPUT_FILE = "roadworks_stalbans.kml"

def fetch_roadworks():
    headers = {"X-API-Key": API_KEY}
    try:
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def generate_kml(data):
    if not data or 'works' not in data:
        print("No data found or invalid format.")
        return

    kml = simplekml.Kml(name="St Albans Live Roadworks")

    for work in data.get('works', []):
        # 提取資訊
        try:
            # Street Manager API 坐標通常在 geometry 或直接有 lat/lon
            lon = work.get('longitude')
            lat = work.get('latitude')
            if lon is None or lat is None: continue

            name = work.get('description', 'Roadwork')[:50]
            description = (
                f"Location: {work.get('street', 'N/A')}\n"
                f"Type: {work.get('work_type', 'N/A')}\n"
                f"Status: {work.get('work_status', 'N/A')}\n"
                f"Dates: {work.get('start_date', '?')} to {work.get('end_date', '?')}"
            )

            pnt = kml.newpoint(name=name, coords=[(lon, lat)])
            pnt.description = description

            # 根據狀態設定圖示 (紅色代表封路，黃色代表工程)
            status = work.get('work_status', '').lower()
            if "closed" in status or "closure" in work.get('work_type', '').lower():
                pnt.style.iconstyle.icon.href = 'http://maps.google.com/mapfiles/kml/paddle/red-circle.png'
            else:
                pnt.style.iconstyle.icon.href = 'http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png'
        except Exception as e:
            print(f"Error processing a work item: {e}")

    kml.save(OUTPUT_FILE)
    print(f"Successfully generated {OUTPUT_FILE} at {datetime.now()}")

if __name__ == "__main__":
    if API_KEY == "YOUR_API_KEY_HERE":
        print("請先設定 STREET_MANAGER_API_KEY 環境變數或在腳本中填入 API Key。")
    else:
        data = fetch_roadworks()
        generate_kml(data)

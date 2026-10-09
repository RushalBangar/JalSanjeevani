import os
import re

files = [
    'frontend/index.html', 
    'frontend/login.html', 
    'frontend/dashboard.html', 
    'frontend/driver.html', 
    'frontend/panchayat.html'
]

new_logo_html = '''    <div class="logo">
      <img src="assets/logo.jpg" alt="JalSanjeevani Logo" style="height: 48px; border-radius: 6px;">
    </div>'''

for p in files:
    filepath = os.path.join(r'd:\Web\RouteGuard', p)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = re.sub(r'    <div class="logo">.*?    </div>', new_logo_html, content, flags=re.DOTALL)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"Failed to update {filepath}: {e}")

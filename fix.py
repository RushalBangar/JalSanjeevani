import os

for r, d, fs in os.walk(r'd:\Web\RouteGuard'):
    if '.git' in r or '__pycache__' in r: 
        continue
    for f in fs:
        if f.endswith(('.html', '.js', '.css', '.py', '.json')):
            fp = os.path.join(r, f)
            try:
                with open(fp, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                if 'JalSanjeevani' in content or 'jalsanjeevani' in content or 'जलसंजीवनी' in content or 'जलसंजीवनी' in content:
                    content = content.replace('JalSanjeevani','JalSanjeevani').replace('jalsanjeevani','jalsanjeevani').replace('जलसंजीवनी','जलसंजीवनी').replace('जलसंजीवनी','जलसंजीवनी')
                    with open(fp, 'w', encoding='utf-8') as file:
                        file.write(content)
            except Exception as e:
                print(f"Error processing {fp}: {e}")

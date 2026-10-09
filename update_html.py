import os

files = [
    'frontend/index.html', 
    'frontend/login.html', 
    'frontend/dashboard.html', 
    'frontend/driver.html', 
    'frontend/panchayat.html'
]

for p in files:
    filepath = os.path.join(r'd:\Web\RouteGuard', p)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update Logo HTML that had span tags
        content = content.replace('Jal<span>Setu</span>', 'Jal<span>Sanjeevani</span>')
        
        # Add Favicon below title
        if '<link rel="icon"' not in content:
            content = content.replace('</title>', '</title>\n  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">')
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"Failed to update {filepath}: {e}")

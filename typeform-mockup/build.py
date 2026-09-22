"""Create the portable HTML export using only the Python standard library."""
from pathlib import Path
import base64
import re

source = Path(__file__).resolve().parent
html = (source / 'index.html').read_text(encoding='utf-8')
fonts = (source / 'assets/fonts.css').read_text(encoding='utf-8')
fonts = re.sub(r'url\(([a-z0-9-]+\.ttf)\)', lambda match: 'url(data:font/ttf;base64,' + base64.b64encode((source / 'assets' / match[1]).read_bytes()).decode() + ')', fonts)
css = (source / 'styles.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="assets/fonts.css">', '<style>\n' + fonts + '\n' + css + '\n</style>')
html = html.replace('<link rel="stylesheet" href="styles.css">', '')
scripts = []
for filename in ['vendor/gsap.min.js', 'app.js']:
    html = html.replace(f'<script defer src="{filename}"></script>', '')
    script = (source / filename).read_text(encoding='utf-8')
    script = re.sub(r'//# sourceMappingURL=.*', '', script)
    scripts.append('<script>\n' + script.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('</body>', '\n'.join(scripts) + '\n</body>')
logo = base64.b64encode((source / 'assets/axiomotl-logo.png').read_bytes()).decode()
html = html.replace('src="assets/axiomotl-logo.png"', 'src="data:image/png;base64,' + logo + '"')
output = source.parent / 'axiomotl-typeform-mockup.html'
output.write_text(html, encoding='utf-8')
assert not re.search(r'(?:src|href)="(?:assets/|vendor/|styles\.css|app\.js)', html)
print(f'Created {output.name} ({output.stat().st_size:,} bytes); all assets embedded.')

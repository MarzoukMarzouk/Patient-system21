const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const icons = [
  { src: path.join(root, 'public', 'icons', 'icon-192.svg'), dest: path.join(root, 'public', 'icons', 'icon-192.png'), size: 192 },
  { src: path.join(root, 'public', 'icons', 'icon-512.svg'), dest: path.join(root, 'public', 'icons', 'icon-512.png'), size: 512 },
];

(async () => {
  for (const icon of icons) {
    if (!fs.existsSync(icon.src)) {
      console.error('Source icon not found:', icon.src);
      continue;
    }
    try {
      await sharp(icon.src).resize(icon.size, icon.size).png({ quality: 90 }).toFile(icon.dest);
      console.log('Wrote', icon.dest);
    } catch (err) {
      console.error('Failed to generate', icon.dest, err);
      process.exitCode = 2;
    }
  }
})();

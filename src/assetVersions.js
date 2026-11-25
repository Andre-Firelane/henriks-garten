// Versionsstempel für alles, was der Phaser-Lader holt (Bilder, Spritesheets, Töne): assets/x.webp wird zu
// v/<Prüfsumme>/assets/x.webp. Diese Adressen behält der Browser dauerhaft im Speicher (netlify.toml), ohne bei jedem Start
// für jede Datei einzeln beim Server nachzufragen. Die Prüfsummen rechnet vite beim Bauen aus (assetVersions in
// vite.config.js); beim Entwickeln (vite dev) gibt es keine, dann bleiben die Adressen, wie sie sind.
// (Bilder in der Oberfläche, z. B. <img src="assets/hand.png">, laufen nicht über den Lader und bleiben ungestempelt.)
import Phaser from 'phaser';

// eslint-disable-next-line no-undef
const VERSIONS = typeof __ASSET_VERSIONS__ !== 'undefined' ? __ASSET_VERSIONS__ : null;

export function versioned(url) {
  if (!VERSIONS || typeof url !== 'string') return url;
  const p = url.replace(/^\.?\//, '');
  const v = VERSIONS[p];
  return v ? `v/${v}/${p}` : url;
}

export function versionLoaderUrls() {
  if (!VERSIONS) return;
  const addFile = Phaser.Loader.LoaderPlugin.prototype.addFile;
  Phaser.Loader.LoaderPlugin.prototype.addFile = function (file) {
    for (const item of Array.isArray(file) ? file : [file]) if (typeof item?.url === 'string') item.url = versioned(item.url);
    return addFile.call(this, file);
  };
}

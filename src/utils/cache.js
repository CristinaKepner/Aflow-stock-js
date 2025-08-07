import fs from 'fs-extra';
import path from 'path';

class CacheManager {
  constructor() {
    this.cacheDir = 'storage/cache';
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirpSync(this.cacheDir);
    }
  }

  generateKey(key) {
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }

  get(key) {
    try {
      const filename = path.join(this.cacheDir, `${this.generateKey(key)}.json`);
      if (fs.existsSync(filename)) {
        const data = fs.readJsonSync(filename);
        if (data.expiry && Date.now() > data.expiry) {
          fs.removeSync(filename);
          return null;
        }
        return data.value;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  set(key, value, ttl = 3600) {
    try {
      const filename = path.join(this.cacheDir, `${this.generateKey(key)}.json`);
      const data = {
        value,
        expiry: Date.now() + (ttl * 1000),
        timestamp: Date.now()
      };
      fs.writeJsonSync(filename, data);
    } catch (error) {
      console.error('Cache set error:', error.message);
    }
  }

  clear() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.removeSync(this.cacheDir);
        fs.mkdirpSync(this.cacheDir);
      }
    } catch (error) {
      console.error('Cache clear error:', error.message);
    }
  }

  getStats() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        return { count: 0, size: 0 };
      }
      
      const files = fs.readdirSync(this.cacheDir);
      const count = files.length;
      let size = 0;
      
      files.forEach(file => {
        const filepath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filepath);
        size += stats.size;
      });
      
      return { count, size };
    } catch (error) {
      return { count: 0, size: 0 };
    }
  }
}

export const cacheManager = new CacheManager();


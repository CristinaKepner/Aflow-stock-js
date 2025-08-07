import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

class CacheManager {
  constructor() {
    this.cacheDir = 'storage/cache';
    this.enabled = process.env.CACHE_ENABLED === 'true';
    this.ttl = parseInt(process.env.CACHE_TTL) || 3600; // 默认1小时
    
    // 确保缓存目录存在
    fs.ensureDirSync(this.cacheDir);
  }

  generateKey(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  getCachePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async get(key) {
    if (!this.enabled) return null;
    
    try {
      const cachePath = this.getCachePath(key);
      if (await fs.pathExists(cachePath)) {
        const data = await fs.readJson(cachePath);
        const now = Date.now();
        
        // 检查是否过期
        if (data.timestamp && (now - data.timestamp) < this.ttl * 1000) {
          return data.value;
        } else {
          // 删除过期缓存
          await fs.remove(cachePath);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error.message);
    }
    
    return null;
  }

  async set(key, value) {
    if (!this.enabled) return;
    
    try {
      const cachePath = this.getCachePath(key);
      const data = {
        value,
        timestamp: Date.now()
      };
      
      await fs.writeJson(cachePath, data, { spaces: 2 });
    } catch (error) {
      console.error('Cache write error:', error.message);
    }
  }

  async clear() {
    if (!this.enabled) return;
    
    try {
      await fs.emptyDir(this.cacheDir);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error.message);
    }
  }

  async getStats() {
    if (!this.enabled) return { enabled: false };
    
    try {
      const files = await fs.readdir(this.cacheDir);
      const stats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.cacheDir, file);
          const stat = await fs.stat(filePath);
          return {
            file,
            size: stat.size,
            modified: stat.mtime
          };
        })
      );
      
      return {
        enabled: true,
        fileCount: files.length,
        files: stats
      };
    } catch (error) {
      console.error('Cache stats error:', error.message);
      return { enabled: false, error: error.message };
    }
  }
}

export const cacheManager = new CacheManager();
export default cacheManager;

// 轻量级统计工具 - 节省Supabase存储空间
export class LightAnalytics {
  private storageKey = 'site_analytics';
  private maxDays = 30; // 本地存储最多保留30天数据
  
  // 获取今日数据
  private getTodayData() {
    if (typeof window === 'undefined') return { data: {}, today: '' };
    
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    
    // 自动清理过期数据
    this.cleanOldData(data);
    
    if (!data[today]) {
      data[today] = {
        pageViews: 0,
        agentClicks: {},
        promptDownloads: {},
        resourceDownloads: {},
        searchKeywords: {},
        uniqueVisitors: new Set(),
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };
    }
    return { data, today };
  }
  
  // 清理过期数据（自动执行）
  private cleanOldData(data: any) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxDays);
    
    Object.keys(data).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date < cutoffDate) {
        delete data[dateStr];
      }
    });
  }
  
  // 保存数据到localStorage
  private saveData(data: any) {
    if (typeof window !== 'undefined') {
      // 转换Set为Array以便JSON序列化
      const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(serializedData));
    }
  }
  
  // 记录页面访问
  trackPageView(page: string, title?: string) {
    const { data, today } = this.getTodayData();
    if (!data[today]) return;
    
    data[today].pageViews++;
    
    // 记录访问者ID（简单的指纹识别）
    const visitorId = this.getVisitorId();
    if (data[today].uniqueVisitors instanceof Set) {
      data[today].uniqueVisitors.add(visitorId);
    } else {
      data[today].uniqueVisitors = new Set([visitorId]);
    }
    
    this.saveData(data);
  }
  
  // 记录智能体点击
  trackAgentClick(agentName: string, agentType: string) {
    const { data, today } = this.getTodayData();
    if (!data[today]) return;
    
    const key = `${agentName}_${agentType}`;
    data[today].agentClicks[key] = (data[today].agentClicks[key] || 0) + 1;
    
    this.saveData(data);
  }
  
  // 记录提示词下载
  trackPromptDownload(promptName: string) {
    const { data, today } = this.getTodayData();
    if (!data[today]) return;
    
    data[today].promptDownloads[promptName] = (data[today].promptDownloads[promptName] || 0) + 1;
    
    this.saveData(data);
  }
  
  // 记录资源下载
  trackResourceDownload(resourceName: string) {
    const { data, today } = this.getTodayData();
    if (!data[today]) return;
    
    data[today].resourceDownloads[resourceName] = (data[today].resourceDownloads[resourceName] || 0) + 1;
    
    this.saveData(data);
  }
  
  // 记录搜索关键词
  trackSearch(keyword: string) {
    const { data, today } = this.getTodayData();
    if (!data[today]) return;
    
    data[today].searchKeywords[keyword] = (data[today].searchKeywords[keyword] || 0) + 1;
    
    this.saveData(data);
  }
  
  // 获取访问者ID（简单指纹）
  private getVisitorId(): string {
    if (typeof window === 'undefined') return 'server';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Visitor fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36);
  }
  
  // 获取统计数据
  getStats(days: number = 7) {
    if (typeof window === 'undefined') return null;
    
    const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    const stats = {
      totalPageViews: 0,
      totalUniqueVisitors: new Set(),
      topAgents: {} as Record<string, number>,
      topPrompts: {} as Record<string, number>,
      topResources: {} as Record<string, number>,
      topSearches: {} as Record<string, number>,
      dailyStats: [] as any[]
    };
    
    // 获取最近N天的数据
    const dates = Object.keys(data)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, days);
    
    dates.forEach(date => {
      const dayData = data[date];
      if (!dayData) return;
      
      stats.totalPageViews += dayData.pageViews || 0;
      
      // 合并独立访客
      if (Array.isArray(dayData.uniqueVisitors)) {
        dayData.uniqueVisitors.forEach((visitor: string) => {
          stats.totalUniqueVisitors.add(visitor);
        });
      }
      
      // 合并热门数据
      Object.entries(dayData.agentClicks || {}).forEach(([key, count]) => {
        stats.topAgents[key] = (stats.topAgents[key] || 0) + (count as number);
      });
      
      Object.entries(dayData.promptDownloads || {}).forEach(([key, count]) => {
        stats.topPrompts[key] = (stats.topPrompts[key] || 0) + (count as number);
      });
      
      Object.entries(dayData.resourceDownloads || {}).forEach(([key, count]) => {
        stats.topResources[key] = (stats.topResources[key] || 0) + (count as number);
      });
      
      Object.entries(dayData.searchKeywords || {}).forEach(([key, count]) => {
        stats.topSearches[key] = (stats.topSearches[key] || 0) + (count as number);
      });
      
      stats.dailyStats.push({
        date,
        pageViews: dayData.pageViews || 0,
        uniqueVisitors: Array.isArray(dayData.uniqueVisitors) ? dayData.uniqueVisitors.length : 0,
        agentClicks: Object.values(dayData.agentClicks || {}).reduce((a: number, b: any) => a + b, 0),
        downloads: Object.values(dayData.promptDownloads || {}).reduce((a: number, b: any) => a + b, 0) +
                  Object.values(dayData.resourceDownloads || {}).reduce((a: number, b: any) => a + b, 0)
      });
    });
    
    return {
      ...stats,
      totalUniqueVisitors: stats.totalUniqueVisitors.size,
      topAgents: this.sortAndLimit(stats.topAgents, 10),
      topPrompts: this.sortAndLimit(stats.topPrompts, 10),
      topResources: this.sortAndLimit(stats.topResources, 10),
      topSearches: this.sortAndLimit(stats.topSearches, 10)
    };
  }
  
  // 排序并限制数量
  private sortAndLimit(obj: Record<string, number>, limit: number) {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, number>);
  }
  
  // 导出数据（用于备份或上传到数据库）
  exportData() {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }
  
  // 清空所有数据
  clearAllData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
  
  // 生成演示数据（仅用于展示）
  generateDemoData() {
    if (typeof window === 'undefined') return;
    
    const demoData: any = {};
    const today = new Date();
    
    // 生成最近7天的演示数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      // 生成随机但合理的数据
      const baseViews = 50 + Math.floor(Math.random() * 100);
      const uniqueVisitors = Math.floor(baseViews * 0.6) + Math.floor(Math.random() * 20);
      
      demoData[dateStr] = {
        pageViews: baseViews,
        uniqueVisitors: Array.from({length: uniqueVisitors}, (_, idx) => `visitor_${idx}_${i}`),
        agentClicks: {
          'ChatGPT助手_chat': Math.floor(Math.random() * 25) + 10,
          'Claude写作助手_chat': Math.floor(Math.random() * 20) + 8,
          '代码生成器_download': Math.floor(Math.random() * 15) + 5,
          'PPT制作助手_chat': Math.floor(Math.random() * 18) + 7,
          '论文写作助手_chat': Math.floor(Math.random() * 12) + 4,
          '数据分析助手_chat': Math.floor(Math.random() * 10) + 3
        },
        promptDownloads: {
          '学术论文写作模板': Math.floor(Math.random() * 15) + 8,
          'PPT制作提示词': Math.floor(Math.random() * 12) + 6,
          '代码注释生成器': Math.floor(Math.random() * 10) + 4,
          '教学设计模板': Math.floor(Math.random() * 8) + 3,
          '数据分析报告模板': Math.floor(Math.random() * 6) + 2
        },
        resourceDownloads: {
          'AI教学入门课件': Math.floor(Math.random() * 20) + 10,
          'ChatGPT使用指南': Math.floor(Math.random() * 18) + 9,
          'AI工具对比表': Math.floor(Math.random() * 15) + 7,
          '提示词工程教程': Math.floor(Math.random() * 12) + 6,
          'AI伦理讨论材料': Math.floor(Math.random() * 8) + 4
        },
        searchKeywords: {
          'ChatGPT': Math.floor(Math.random() * 20) + 10,
          '提示词': Math.floor(Math.random() * 15) + 8,
          'AI教学': Math.floor(Math.random() * 12) + 6,
          '论文写作': Math.floor(Math.random() * 10) + 5,
          'PPT制作': Math.floor(Math.random() * 8) + 4,
          '代码生成': Math.floor(Math.random() * 6) + 3
        },
        userAgent: navigator.userAgent,
        timestamp: date.getTime()
      };
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(demoData));
    console.log('✅ 演示数据已生成！');
  }
}

// 创建全局实例
export const analytics = new LightAnalytics();
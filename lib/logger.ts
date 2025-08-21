/**
 * 数据库连接日志管理器
 * 用于记录、存储和查看数据库连接相关的日志信息
 */

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  category: 'CONNECTION' | 'QUERY' | 'AUTH' | 'RETRY' | 'KEEPALIVE' | 'SWITCH'
  message: string
  details?: any
  duration?: number
  stackTrace?: string
  metadata?: {
    connectionMode?: 'sdk' | 'api'
    retryCount?: number
    tableName?: string
    operation?: string
    errorCode?: string
    duration?: number
    previousStatus?: string
    retriesCleared?: number
    recordCount?: number
    errorMessage?: string
    interval?: number
    table?: string
    totalDuration?: number
    apiDuration?: number
    fallbackMode?: string
    currentMode?: string
    error?: string
    maxRetries?: number
    originalError?: string
    finalAttempt?: number
    waitTime?: number
    attempt?: number
    contentType?: string
    dataSize?: number
    recordId?: string
  }
}

class DatabaseLogger {
  private static instance: DatabaseLogger
  private logs: LogEntry[] = []
  private readonly MAX_LOGS = 1000 // 最多保存1000条日志
  private readonly STORAGE_KEY = 'db_connection_logs'

  static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger()
    }
    return DatabaseLogger.instance
  }

  constructor() {
    // 从localStorage加载历史日志
    this.loadLogsFromStorage()
  }

  /**
   * 记录日志
   */
  log(level: LogEntry['level'], category: LogEntry['category'], message: string, details?: any, metadata?: LogEntry['metadata']): void {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      metadata,
      stackTrace: level === 'ERROR' ? new Error().stack : undefined
    }

    // 添加到内存日志
    this.logs.unshift(logEntry)
    
    // 限制日志数量
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS)
    }

    // 保存到localStorage
    this.saveLogsToStorage()

    // 输出到控制台
    this.outputToConsole(logEntry)
  }

  /**
   * 开始性能计时
   */
  startTimer(operation: string): () => number {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.log('DEBUG', 'QUERY', `操作 ${operation} 耗时`, { duration: `${duration.toFixed(2)}ms` }, { operation, duration })
      return duration
    }
  }

  /**
   * 记录连接状态变化
   */
  logConnectionChange(from: string, to: string, reason?: string): void {
    this.log('INFO', 'CONNECTION', `连接状态变化: ${from} → ${to}`, { from, to, reason }, { connectionMode: to as any })
  }

  /**
   * 记录模式切换
   */
  logModeSwitch(fromMode: 'sdk' | 'api', toMode: 'sdk' | 'api', reason: string): void {
    this.log('WARN', 'SWITCH', `连接模式切换: ${fromMode} → ${toMode}`, { reason }, { connectionMode: toMode })
  }

  /**
   * 记录重试
   */
  logRetry(operation: string, attempt: number, maxRetries: number, error?: any): void {
    this.log('WARN', 'RETRY', `重试操作: ${operation} (${attempt}/${maxRetries})`, { error: error?.message, attempt, maxRetries }, { operation, retryCount: attempt })
  }

  /**
   * 记录保活
   */
  logKeepAlive(success: boolean, details?: any): void {
    this.log(success ? 'DEBUG' : 'WARN', 'KEEPALIVE', `数据库保活${success ? '成功' : '失败'}`, details)
  }

  /**
   * 记录数据库操作
   */
  logDatabaseOperation(tableName: string, operation: string, success: boolean, details?: any, duration?: number): void {
    const level = success ? 'INFO' : 'ERROR'
    this.log(level, 'QUERY', `${tableName}.${operation} ${success ? '成功' : '失败'}`, details, { tableName, operation, duration })
  }

  /**
   * 记录错误
   */
  logError(category: LogEntry['category'], message: string, error: any, metadata?: LogEntry['metadata']): void {
    const details = {
      errorMessage: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorHint: error?.hint,
      stack: error?.stack
    }
    
    this.log('ERROR', category, message, details, { ...metadata, errorCode: error?.code })
  }

  /**
   * 获取日志
   */
  getLogs(filter?: {
    level?: LogEntry['level']
    category?: LogEntry['category']
    since?: Date
    limit?: number
  }): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level)
    }

    if (filter?.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category)
    }

    if (filter?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!)
    }

    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(0, filter.limit)
    }

    return filteredLogs
  }

  /**
   * 获取连接统计
   */
  getConnectionStats(): {
    totalConnections: number
    successfulConnections: number
    failedConnections: number
    modeSwitch: number
    avgConnectionTime: number
    errorTypes: Record<string, number>
  } {
    const connectionLogs = this.getLogs({ category: 'CONNECTION' })
    const errorLogs = this.getLogs({ level: 'ERROR' })
    const switchLogs = this.getLogs({ category: 'SWITCH' })

    const errorTypes: Record<string, number> = {}
    errorLogs.forEach(log => {
      const errorCode = log.metadata?.errorCode || 'UNKNOWN'
      errorTypes[errorCode] = (errorTypes[errorCode] || 0) + 1
    })

    const connectionTimes = connectionLogs
      .filter(log => log.duration)
      .map(log => log.duration!)
    
    const avgConnectionTime = connectionTimes.length > 0 
      ? connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length 
      : 0

    return {
      totalConnections: connectionLogs.length,
      successfulConnections: connectionLogs.filter(log => !log.message.includes('失败')).length,
      failedConnections: errorLogs.filter(log => log.category === 'CONNECTION').length,
      modeSwitch: switchLogs.length,
      avgConnectionTime,
      errorTypes
    }
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
    this.saveLogsToStorage()
    console.log('📝 数据库连接日志已清空')
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 输出到控制台
   */
  private outputToConsole(logEntry: LogEntry): void {
    const emoji = this.getLevelEmoji(logEntry.level)
    const timestamp = logEntry.timestamp.toLocaleTimeString()
    const category = `[${logEntry.category}]`
    
    const consoleMethod = this.getConsoleMethod(logEntry.level)
    
    if (logEntry.details || logEntry.metadata) {
      consoleMethod(
        `${emoji} ${timestamp} ${category} ${logEntry.message}`,
        logEntry.details,
        logEntry.metadata
      )
    } else {
      consoleMethod(`${emoji} ${timestamp} ${category} ${logEntry.message}`)
    }

    // 错误时额外输出堆栈
    if (logEntry.level === 'ERROR' && logEntry.stackTrace) {
      console.error('Stack trace:', logEntry.stackTrace)
    }
  }

  private getLevelEmoji(level: LogEntry['level']): string {
    switch (level) {
      case 'DEBUG': return '🐛'
      case 'INFO': return 'ℹ️'
      case 'WARN': return '⚠️'
      case 'ERROR': return '❌'
      default: return '📝'
    }
  }

  private getConsoleMethod(level: LogEntry['level']): (...args: any[]) => void {
    switch (level) {
      case 'DEBUG': return console.debug
      case 'INFO': return console.info
      case 'WARN': return console.warn
      case 'ERROR': return console.error
      default: return console.log
    }
  }

  /**
   * 从localStorage加载日志
   */
  private loadLogsFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        if (stored) {
          const parsedLogs = JSON.parse(stored)
          this.logs = parsedLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }))
        }
      }
    } catch (error) {
      console.warn('加载历史日志失败:', error)
    }
  }

  /**
   * 保存日志到localStorage
   */
  private saveLogsToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs))
      }
    } catch (error) {
      console.warn('保存日志失败:', error)
    }
  }
}

// 导出单例实例
export const dbLogger = DatabaseLogger.getInstance()

// 便捷方法
export const logConnection = (message: string, details?: any, metadata?: LogEntry['metadata']) => 
  dbLogger.log('INFO', 'CONNECTION', message, details, metadata)

export const logError = (category: LogEntry['category'], message: string, error: any, metadata?: LogEntry['metadata']) => 
  dbLogger.logError(category, message, error, metadata)

export const logDebug = (category: LogEntry['category'], message: string, details?: any, metadata?: LogEntry['metadata']) => 
  dbLogger.log('DEBUG', category, message, details, metadata) 
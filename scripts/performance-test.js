#!/usr/bin/env node

/**
 * 性能测试脚本
 * 用于测试优化后的网站性能
 */

const https = require('https')
const { performance } = require('perf_hooks')

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvrikhctrwowswcamkfj.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmlraGN0cndvd3N3Y2Fta2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzUyMjIsImV4cCI6MjA2NTQxMTIyMn0.xFEVSItfhhgI7Ow9-2v0Bz1MNdGaW2QQEtEn2PaA4kg',
  testUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
}

class PerformanceTester {
  constructor() {
    this.results = []
  }

  async runTest(name, testFn) {
    console.log(`\n🔄 运行测试: ${name}`)
    const startTime = performance.now()
    
    try {
      const result = await testFn()
      const duration = performance.now() - startTime
      
      this.results.push({
        name,
        duration: duration.toFixed(2),
        status: 'success',
        details: result
      })
      
      console.log(`✅ ${name} 完成 - ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.results.push({
        name,
        duration: duration.toFixed(2),
        status: 'failed',
        error: error.message
      })
      
      console.log(`❌ ${name} 失败 - ${duration.toFixed(2)}ms - ${error.message}`)
      throw error
    }
  }

  async testSupabaseConnection() {
    return this.runTest('Supabase连接测试', async () => {
      const url = `${config.supabaseUrl}/rest/v1/agents?select=count`
      
      return new Promise((resolve, reject) => {
        const options = {
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }

        const req = https.request(url, options, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ statusCode: res.statusCode, dataLength: data.length })
            } else {
              reject(new Error(`HTTP ${res.statusCode}`))
            }
          })
        })

        req.on('error', reject)
        req.setTimeout(10000, () => reject(new Error('请求超时')))
        req.end()
      })
    })
  }

  async testMultipleConnections() {
    return this.runTest('并发连接测试', async () => {
      const tables = ['agents', 'prompts', 'teaching_resources', 'custom_requests']
      const promises = tables.map(table => 
        this.makeSupabaseRequest(`/rest/v1/${table}?select=count`)
      )

      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return { successful, failed, total: tables.length }
    })
  }

  async testDatabaseWakeUp() {
    return this.runTest('数据库唤醒测试', async () => {
      const attempts = []
      
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now()
        try {
          await this.makeSupabaseRequest('/rest/v1/agents?select=id&limit=1')
          attempts.push({
            attempt: i + 1,
            duration: (performance.now() - startTime).toFixed(2),
            status: 'success'
          })
        } catch (error) {
          attempts.push({
            attempt: i + 1,
            duration: (performance.now() - startTime).toFixed(2),
            status: 'failed',
            error: error.message
          })
        }
        
        // 间隔1秒
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return attempts
    })
  }

  async testPageLoad() {
    return this.runTest('页面加载测试', async () => {
      if (config.testUrl.includes('localhost')) {
        return { message: '跳过本地环境的页面加载测试' }
      }

      return new Promise((resolve, reject) => {
        const req = https.request(config.testUrl, (res) => {
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              contentLength: data.length,
              headers: {
                'cache-control': res.headers['cache-control'],
                'content-encoding': res.headers['content-encoding']
              }
            })
          })
        })

        req.on('error', reject)
        req.setTimeout(15000, () => reject(new Error('页面加载超时')))
        req.end()
      })
    })
  }

  async makeSupabaseRequest(path) {
    const url = `${config.supabaseUrl}${path}`
    
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }

      const req = https.request(url, options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data || '{}'))
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        })
      })

      req.on('error', reject)
      req.setTimeout(8000, () => reject(new Error('请求超时')))
      req.end()
    })
  }

  async testCacheEffectiveness() {
    return this.runTest('缓存效果测试', async () => {
      if (config.testUrl.includes('localhost')) {
        return { message: '跳过本地环境的缓存测试' }
      }

      // 第一次请求
      const firstRequest = await this.makePageRequest()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 第二次请求（应该更快）
      const secondRequest = await this.makePageRequest()

      return {
        firstRequest: firstRequest.duration,
        secondRequest: secondRequest.duration,
        improvement: ((firstRequest.duration - secondRequest.duration) / firstRequest.duration * 100).toFixed(2) + '%'
      }
    })
  }

  async makePageRequest() {
    const startTime = performance.now()
    
    return new Promise((resolve, reject) => {
      const req = https.request(config.testUrl, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const duration = performance.now() - startTime
          resolve({
            duration: duration.toFixed(2),
            statusCode: res.statusCode,
            contentLength: data.length
          })
        })
      })

      req.on('error', reject)
      req.setTimeout(10000, () => reject(new Error('请求超时')))
      req.end()
    })
  }

  printReport() {
    console.log('\n📊 性能测试报告')
    console.log('='.repeat(50))
    
    console.log('\n🔍 测试结果:')
    this.results.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌'
      console.log(`${status} ${result.name}: ${result.duration}ms`)
      
      if (result.details && typeof result.details === 'object') {
        console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`)
      }
      
      if (result.error) {
        console.log(`   错误: ${result.error}`)
      }
    })

    const successCount = this.results.filter(r => r.status === 'success').length
    const totalCount = this.results.length
    const successRate = (successCount / totalCount * 100).toFixed(1)

    console.log(`\n📈 总体统计:`)
    console.log(`   成功率: ${successRate}% (${successCount}/${totalCount})`)
    
    const avgDuration = this.results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + parseFloat(r.duration), 0) / successCount

    if (avgDuration) {
      console.log(`   平均响应时间: ${avgDuration.toFixed(2)}ms`)
    }

    console.log('\n🎯 优化建议:')
    if (successRate < 80) {
      console.log('   - 考虑升级Supabase计划以提高连接稳定性')
    }
    if (avgDuration > 1000) {
      console.log('   - 考虑启用CDN加速以减少延迟')
    }
    if (successRate >= 95 && avgDuration < 500) {
      console.log('   - 性能表现优秀！👍')
    }
  }
}

async function main() {
  console.log('🚀 开始性能测试...')
  console.log(`测试目标: ${config.testUrl}`)
  console.log(`数据库: ${config.supabaseUrl}`)
  
  const tester = new PerformanceTester()
  
  try {
    // 运行所有测试
    await tester.testSupabaseConnection()
    await tester.testDatabaseWakeUp()
    await tester.testMultipleConnections()
    await tester.testPageLoad()
    await tester.testCacheEffectiveness()
    
  } catch (error) {
    console.log(`\n⚠️ 某些测试失败，但会继续运行其他测试`)
  }
  
  // 打印报告
  tester.printReport()
  
  console.log('\n🎉 性能测试完成！')
  console.log('\n💡 如需帮助优化性能，请参考 CHINA_ACCESS_OPTIMIZATION.md 文档')
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { PerformanceTester }
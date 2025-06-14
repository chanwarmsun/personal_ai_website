'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // 简单验证（生产环境建议使用更安全的方式）
    if (form.username === 'admin' && form.password === 'admin123') {
      localStorage.setItem('admin_token', 'authenticated')
      router.push('/admin')
    } else {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">管理员登录</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">账号</label>
            <input 
              type="text" 
              value={form.username}
              onChange={(e) => setForm(f => ({...f, username: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" 
              placeholder="请输入管理员账号" 
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">密码</label>
            <input 
              type="password" 
              value={form.password}
              onChange={(e) => setForm(f => ({...f, password: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" 
              placeholder="请输入密码" 
            />
          </div>
          <button type="submit" className="w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-lg shadow hover:shadow-lg transition-all duration-200">登录</button>
        </form>
        <a href="/" className="block text-center mt-6 text-indigo-500 hover:underline">返回首页</a>
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          测试账号：admin<br/>
          测试密码：admin123
        </div>
      </div>
    </div>
  )
} 
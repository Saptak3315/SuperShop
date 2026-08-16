import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogIn, Loader2, Mail, Lock } from 'lucide-react'
import { AxiosError } from 'axios'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoggingIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      const error = err as AxiosError<{ message: string }>
      setError(error.response?.data?.message || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8 transform transition-all hover:scale-[1.01]">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 shadow-lg -rotate-3 hover:rotate-0 transition-transform duration-300">
            <LogIn className="h-9 w-9 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 font-medium">
            Sign in to manage your store inventory
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-100 animate-bounce-short">
              <div className="text-sm text-red-600 font-semibold text-center">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600 text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-0 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-100 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-0 focus:border-indigo-500 transition-all sm:text-sm font-medium"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-indigo-200/50 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 font-medium">
            Don't have a store yet?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

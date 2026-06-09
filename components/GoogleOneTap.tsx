'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    google?: any
  }
}

export default function GoogleOneTap() {
  const router = useRouter()
  const initialized = useRef(false)

  const handleCredential = async (response: { credential: string }) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    })
    if (error) {
      alert('구글 로그인 실패: ' + error.message)
      return
    }
    const user = data.user
    const email = user?.email ?? ''
    if (!email.endsWith('@kentech.ac.kr')) {
      await supabase.auth.signOut()
      alert('켄텍 이메일(@kentech.ac.kr) 계정만 이용할 수 있어요.')
      return
    }
    // 닉네임 미설정이면 setup으로
    const { data: me } = await supabase.from('users').select('nickname').eq('id', user!.id).single()
    if (!me?.nickname) {
      router.push('/setup')
    } else {
      router.push('/')
    }
    router.refresh()
  }

  const init = () => {
    if (initialized.current) return
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return
    initialized.current = true
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    const target = document.getElementById('google-onetap-btn')
    if (target) {
      window.google.accounts.id.renderButton(target, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        locale: 'ko',
      })
    }
    window.google.accounts.id.prompt()
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={init} />
      <div id="google-onetap-btn" className="flex justify-center"></div>
    </>
  )
}

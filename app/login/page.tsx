import GoogleOneTap from '@/components/GoogleOneTap'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-md text-center">
        <h1 className="mb-2 text-3xl font-bold">🥕 켄근마켓</h1>
        <p className="mb-1 text-gray-600">켄텍 학생 전용 중고거래 + 심부름</p>
        <p className="mb-8 text-sm text-gray-400">@kentech.ac.kr 계정으로 시작하세요</p>

        <div className="flex justify-center">
          <GoogleOneTap />
        </div>

        <p className="mt-8 text-xs text-gray-400">
          🔐 켄텍 구글 계정으로 로그인하면 자동으로 가입돼요
        </p>
      </div>
    </div>
  )
}

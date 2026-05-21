import { createClient } from '@/lib/supabase/server'
import CommentList from './CommentList'
import CommentForm from './CommentForm'

// 댓글 섹션 (Server Component)
// 상세 페이지에 통째로 끼워넣는 진입점
type Props = {
  postId: string
  postType: 'product' | 'errand'
}

export default async function CommentSection({ postId, postType }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <section className="mt-8 pt-6 border-t">
      <h2 className="text-lg font-bold mb-4">💬 댓글</h2>
      
      <div className="mb-4">
        <CommentForm
          postId={postId}
          postType={postType}
          isLoggedIn={!!user}
        />
      </div>

      <CommentList postId={postId} postType={postType} />
    </section>
  )
}
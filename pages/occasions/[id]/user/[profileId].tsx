import React from 'react'
import { useRouter } from 'next/router'

import ViewWishlist from '../../../../features/Wishlist/ViewWishlist'
import Layout from '../../../../components/Layout'

export default function Page(props) {
  const router = useRouter()
  const { id, profileId } = router.query

  return (
    <Layout requireAuth>
      <ViewWishlist id={id as string} profileId={profileId as string} />
    </Layout>
  )
}

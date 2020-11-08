import React from 'react'
import { useRouter } from 'next/router'

import Layout from '../../components/Layout'
import ViewOccasion from '../../features/Occasion/ViewOccasion'

export default function Page(props) {
  const router = useRouter()
  const { id } = router.query

  return (
    <Layout requireAuth>
      <ViewOccasion id={id as string} />
    </Layout>
  )
}

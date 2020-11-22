import React from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import ViewShoppingList from '../../../features/ShoppingList/ViewShoppingList'

export default function Page(props) {
  const router = useRouter()
  const { id } = router.query

  return (
    <Layout requireAuth>
      <ViewShoppingList occasionId={id as string} />
    </Layout>
  )
}

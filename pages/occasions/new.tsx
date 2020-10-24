import React from 'react'
import Layout from '../../components/Layout'
import CreateOccasionForm from '../../features/Occasion/CreateOccasionForm'

// Create occasion

export default function () {
  return (
    <Layout requireAuth>
      <CreateOccasionForm />
    </Layout>
  )
}

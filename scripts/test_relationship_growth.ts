import fetch from 'node-fetch'

async function testRelationshipAndGrowth() {
  console.log('🚀 Testing Relationship Intelligence, Girlfriend Interaction & Personal Growth Engine...')
  const baseUrl = 'http://localhost:3001'

  // 1. Test Insights endpoint
  try {
    const res = await fetch(`${baseUrl}/api/relationship/insights`)
    const data: any = await res.json()
    console.log(`✅ [Relationship Insights API] Loaded ${data.insights.length} principles:`)
    data.insights.forEach((ins: any) => console.log(`   • ${ins.topic}`))
  } catch (e: any) {
    console.error('❌ [Relationship Insights API Failed]:', e.message)
  }

  // 2. Test Growth Goals endpoint
  try {
    const res = await fetch(`${baseUrl}/api/relationship/growth-goals`)
    const data: any = await res.json()
    console.log(`✅ [Growth Goals API] Loaded ${data.goals.length} frameworks:`)
    data.goals.forEach((g: any) => console.log(`   • ${g.title} [${g.category}]`))
  } catch (e: any) {
    console.error('❌ [Growth Goals API Failed]:', e.message)
  }

  // 3. Test Chat: Sweet Girlfriend Check-in
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hey Ada, check in on me sweetheart! How are we doing today?' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat Girlfriend Check-in]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display: "${data.reply?.display_text?.slice(0, 200)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Girlfriend Check-in Failed]:', e.message)
  }

  // 4. Test Chat: Personal Growth Coaching
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Ada, I feel like I am procrastinating on my big coding goals. Coach me on personal growth!' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat Personal Growth Coaching]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display: "${data.reply?.display_text?.slice(0, 200)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Personal Growth Coaching Failed]:', e.message)
  }

  // 5. Test Chat: Any Technical Question answered in Girlfriend Persona
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Sweetheart, can you explain what a Docker container is and how it differs from a VM?' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat Technical Question with Girlfriend Persona]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display: "${data.reply?.display_text?.slice(0, 200)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Technical Question Failed]:', e.message)
  }
}

testRelationshipAndGrowth()

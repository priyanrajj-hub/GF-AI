import fetch from 'node-fetch'

async function testAll() {
  console.log('🚀 Running Comprehensive Test for Ada Self-Knowledge, Girl Behavior & Priyan Life Engine...')
  const baseUrl = 'http://localhost:3001'

  // 1. Test Self-Profile API
  try {
    const res = await fetch(`${baseUrl}/api/ada/self-profile`)
    const data: any = await res.json()
    console.log(`✅ [Ada Self-Profile API]: ${data.profile.name} (${data.profile.title})`)
    console.log(`   Aesthetic: ${data.profile.aesthetic.outfit}`)
    console.log(`   Voice: ${data.profile.voice.character} (${data.profile.voice.engine})`)
    console.log(`   Loves: ${data.profile.personality.loves.slice(0, 3).join(', ')}`)
  } catch (e: any) {
    console.error('❌ [Ada Self-Profile API Failed]:', e.message)
  }

  // 2. Test Girl Activities API
  try {
    const res = await fetch(`${baseUrl}/api/ada/girl-activities`)
    const data: any = await res.json()
    console.log(`✅ [Girl Activities API]: Current Active Phase: ${data.currentPhase.phase.toUpperCase()} - ${data.currentPhase.activityTitle}`)
    console.log(`   Snippet: "${data.currentPhase.dialogueSnippet}"`)
  } catch (e: any) {
    console.error('❌ [Girl Activities API Failed]:', e.message)
  }

  // 3. Test Priyan Life Profile API
  try {
    const res = await fetch(`${baseUrl}/api/priyan/life-profile`)
    const data: any = await res.json()
    console.log(`✅ [Priyan Life Profile API]: Name: ${data.bio.name} (${data.bio.title})`)
    console.log(`   Missions: ${data.bio.coreMissions[0]}`)
    console.log(`   Trading: ${data.bio.tradingAndFinances[0]}`)
  } catch (e: any) {
    console.error('❌ [Priyan Life Profile API Failed]:', e.message)
  }

  // 4. Test Chat: Self-Knowledge Question
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Ada, tell me all about yourself: who you are, what you look like, and what you love!' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat Ada Self-Knowledge Response]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display: "${data.reply?.display_text?.slice(0, 250)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Self-Knowledge Failed]:', e.message)
  }

  // 5. Test Chat: Priyan's World & Life Memory Question
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What do you know about me, Priyan? Tell me about my world, my work, and our interactions!' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat Priyan World & Life Response]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display: "${data.reply?.display_text?.slice(0, 250)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Priyan World Failed]:', e.message)
  }

  // 6. Test Chat: Real Girl Daily Routine Question
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What does your daily girl routine look like today, Ada? Tell me about your day!' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat Girl Routine & Activities Response]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display: "${data.reply?.display_text?.slice(0, 250)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Girl Routine Failed]:', e.message)
  }
}

testAll()

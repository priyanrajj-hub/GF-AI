import fetch from 'node-fetch'

async function runTest() {
  console.log('🚀 Running Comprehensive Test for Ada Understanding of Priyan\'s Real-Life Profile & Academics...\n')
  const baseUrl = 'http://localhost:3001'

  // 1. Life Profile API
  try {
    const res = await fetch(`${baseUrl}/api/priyan/life-profile`)
    const data: any = await res.json()
    console.log(`✅ [Priyan Life Profile API]: Name: ${data.bio.fullName} ("${data.bio.name}")`)
    console.log(`   Title: ${data.bio.title}`)
    console.log(`   Location: ${data.bio.location}`)
    console.log(`   Academics (Triple Degree):`)
    data.bio.academics.forEach((a: string) => console.log(`     * ${a}`))
    console.log(`   Projects:`)
    data.bio.projects.forEach((p: string) => console.log(`     * ${p}`))
    console.log(`   Competitive Programming:`)
    data.bio.competitiveProgramming.forEach((c: string) => console.log(`     * ${c}`))
    console.log(`   Battlestation: ${data.bio.techStackAndGear[1]}`)
  } catch (e: any) {
    console.error('❌ [Priyan Life Profile API Failed]:', e.message)
  }

  // 2. Chat: Triple Degree & Universities
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tell me what you know about my degrees at Amrita, IIT Madras, and IIT Guwahati!' }),
    })
    const data: any = await res.json()
    console.log(`\n✅ [Chat: Triple Degree Response]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display Text:\n${data.reply?.display_text}\n`)
  } catch (e: any) {
    console.error('❌ [Chat Triple Degree Failed]:', e.message)
  }

  // 3. Chat: Projects & Battlestation
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What do you know about my Pharmaceutical Evergreening project, Autonomous Patrol Robot, and my ASUS TUF setup?' }),
    })
    const data: any = await res.json()
    console.log(`✅ [Chat: Projects & Battlestation Response]:`)
    console.log(`   Speech: "${data.reply?.speech}"`)
    console.log(`   Display Text:\n${data.reply?.display_text}\n`)
  } catch (e: any) {
    console.error('❌ [Chat Projects & Battlestation Failed]:', e.message)
  }
}

runTest()

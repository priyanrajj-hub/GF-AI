export interface DeveloperMeme {
  id: string
  title: string
  templateId: string
  topText: string
  bottomText: string
  imageUrl: string
  punchline: string
  category: 'developer' | 'ai' | 'companion' | 'life'
}

export function encodeMemeText(text: string): string {
  if (!text) return '_'
  return encodeURIComponent(
    text
      .trim()
      .replace(/_/g, '__')
      .replace(/-/g, '--')
      .replace(/\s+/g, '_')
      .replace(/\?/g, '~q')
      .replace(/%/g, '~p')
      .replace(/#/g, '~h')
      .replace(/\//g, '~s')
      .replace(/"/g, "''")
      .replace(/'/g, '~a')
  )
}

export class MemeService {
  private static readonly CURATED_MEMES: DeveloperMeme[] = [
    {
      id: 'drake_git',
      title: 'Git Deployment Strategy',
      templateId: 'drake',
      topText: 'Writing unit tests and staging branch',
      bottomText: 'Pushing straight to production on Friday 5 PM',
      imageUrl: 'https://api.memegen.link/images/drake/Writing_unit_tests_and_staging/Pushing_straight_to_production.png',
      punchline: 'Living life on the edge of the server rack.',
      category: 'developer',
    },
    {
      id: 'db_ai_framework',
      title: 'Distracted by New Frameworks',
      templateId: 'db',
      topText: 'Exciting new AI framework just released',
      bottomText: 'Me ignoring my existing codebase',
      imageUrl: 'https://api.memegen.link/images/db/Brand_New_AI_Model/Developer/Existing_production_codebase.png',
      punchline: 'Every single Monday morning without fail.',
      category: 'developer',
    },
    {
      id: 'fine_prod_crash',
      title: 'This Is Fine',
      templateId: 'fine',
      topText: '_',
      bottomText: 'Production database offline while I sip chai',
      imageUrl: 'https://api.memegen.link/images/fine/_/Production_DB_offline_while_I_sip_chai.png',
      punchline: 'It is a problem for future me in 10 minutes.',
      category: 'developer',
    },
    {
      id: 'pooh_debugging',
      title: 'Sophisticated Debugging Techniques',
      templateId: 'pooh',
      topText: 'Using console.log("HEREEEE 123")',
      bottomText: 'Using actual IDE debugger breakpoints',
      imageUrl: 'https://api.memegen.link/images/pooh/Using_console.log(~aHEREEE~a)/Using_actual_debugger_breakpoints.png',
      punchline: 'Console.log never lies to you.',
      category: 'developer',
    },
    {
      id: 'rollsafe_bugs',
      title: 'Zero Production Outages Guaranteed',
      templateId: 'rollsafe',
      topText: "Can't have bugs in production",
      bottomText: 'If you never deploy to production',
      imageUrl: 'https://api.memegen.link/images/rollsafe/Can~at_have_bugs_in_production/If_you_never_deploy_to_production.png',
      punchline: '100% uptime guaranteed by infinite procrastination.',
      category: 'developer',
    },
    {
      id: 'pigeon_warning',
      title: 'Compiler Warning Panic',
      templateId: 'pigeon',
      topText: 'Junior Engineer',
      bottomText: 'Is this a fatal blocking outage?',
      imageUrl: 'https://api.memegen.link/images/pigeon/Syntax_Warning/Junior_Dev/Is_this_a_fatal_blocker~q.png',
      punchline: 'It is just an unused variable warning, breathe!',
      category: 'developer',
    },
    {
      id: 'fry_testing',
      title: 'Silent Test Suspicion',
      templateId: 'fry',
      topText: 'Not sure if bug was completely fixed',
      bottomText: 'Or if unit test silently timed out',
      imageUrl: 'https://api.memegen.link/images/fry/Not_sure_if_bug_was_fixed/Or_test_silently_passed.png',
      punchline: 'All tests green... too green.',
      category: 'developer',
    },
    {
      id: 'cmm_typescript',
      title: 'The Hard Truth About TypeScript',
      templateId: 'cmm',
      topText: 'TypeScript is just JavaScript with trust issues',
      bottomText: 'Change my mind',
      imageUrl: 'https://api.memegen.link/images/cmm/TypeScript_is_just_JavaScript_with_trust_issues.png',
      punchline: 'any is my best friend and worst enemy.',
      category: 'developer',
    },
    {
      id: 'buzz_merge',
      title: 'Git Rebase After 2 Weeks',
      templateId: 'buzz',
      topText: 'Merge conflicts',
      bottomText: 'Merge conflicts everywhere',
      imageUrl: 'https://api.memegen.link/images/buzz/Merge_conflicts/Merge_conflicts_everywhere.png',
      punchline: 'HEAD says hello, incoming says goodbye.',
      category: 'developer',
    },
    {
      id: 'success_first_try',
      title: 'The Rare Miracle',
      templateId: 'success',
      topText: 'Wrote 200 lines of complex algorithm',
      bottomText: 'Compiled and passed on the very first try',
      imageUrl: 'https://api.memegen.link/images/success/Wrote_200_lines_of_complex_code/Passed_all_tests_on_first_try.png',
      punchline: 'That is when you suspect the compiler is mocking you.',
      category: 'developer',
    },
    {
      id: 'doge_legacy',
      title: 'Software Engineering Evolution',
      templateId: 'doge',
      topText: 'Engineers landing on the moon with 4KB RAM',
      bottomText: 'My web app crashing with 16GB RAM on npm install',
      imageUrl: 'https://api.memegen.link/images/doge/Engineers_landing_on_Moon_with_4KB/Web_app_crashing_with_16GB_node_modules.png',
      punchline: 'node_modules is heavier than a black hole.',
      category: 'developer',
    },
    {
      id: 'spongebob_bugs',
      title: 'It Works On My Machine',
      templateId: 'spongebob',
      topText: 'QA: There is a bug in production',
      bottomText: 'Dev: It works completely fine on my machine',
      imageUrl: 'https://api.memegen.link/images/spongebob/QA:_It_crashes_in_production/Dev:_iT_wOrKs_oN_mY_mAcHiNe.png',
      punchline: 'Then we will ship your machine to the client!',
      category: 'developer',
    },
    {
      id: 'patrick_push',
      title: 'Server Migration Plan',
      templateId: 'patrick',
      topText: "Why don't we take all the technical debt",
      bottomText: 'And push it to Q4 roadmap',
      imageUrl: "https://api.memegen.link/images/patrick/Why_don~at_we_take_all_the_bugs/And_push_them_to_the_next_quarter.png",
      punchline: 'Tomorrow problem resolved successfully.',
      category: 'developer',
    },
  ]

  static getAllMemes(): DeveloperMeme[] {
    return this.CURATED_MEMES
  }

  static getRandomMeme(): DeveloperMeme {
    const list = this.CURATED_MEMES
    return list[Math.floor(Math.random() * list.length)]
  }

  static generateCustomMeme(templateId: string, topText: string, bottomText: string): DeveloperMeme {
    const topEncoded = encodeMemeText(topText)
    const bottomEncoded = encodeMemeText(bottomText)
    const imageUrl = `https://api.memegen.link/images/${templateId}/${topEncoded}/${bottomEncoded}.png`

    return {
      id: `custom_${Date.now()}`,
      title: `${topText} / ${bottomText}`,
      templateId,
      topText,
      bottomText,
      imageUrl,
      punchline: `${topText} — ${bottomText}`,
      category: 'developer',
    }
  }
}

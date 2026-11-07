import type { GlobalMarketHoursRadar, MarketSessionInfo } from '@ada/shared'

interface TimeParts {
  day: number // 0 = Sun, 1 = Mon, ..., 6 = Sat
  hour: number
  minute: number
  second: number
  timeStr: string
}

function getTimePartsInTimezone(date: Date, timezone: string): TimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  let weekdayStr = ''
  let hour = 0
  let minute = 0
  let second = 0

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value
    if (part.type === 'hour') hour = parseInt(part.value, 10)
    if (part.type === 'minute') minute = parseInt(part.value, 10)
    if (part.type === 'second') second = parseInt(part.value, 10)
  }

  // Handle 24-hour rollover if Intl outputs 24
  if (hour === 24) hour = 0

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const day = dayMap[weekdayStr] ?? date.getDay()

  const hStr = hour.toString().padStart(2, '0')
  const mStr = minute.toString().padStart(2, '0')
  const sStr = second.toString().padStart(2, '0')

  return {
    day,
    hour,
    minute,
    second,
    timeStr: `${hStr}:${mStr}:${sStr}`,
  }
}

function formatCountdown(totalSec: number): string {
  if (totalSec <= 0) return 'now'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) {
    return `${h}h ${m}m`
  }
  return `${m}m`
}

export class MarketHoursService {
  /**
   * Generates real-time operating and non-operating radar for global markets
   */
  static getGlobalMarketHoursRadar(nowMs: number = Date.now()): GlobalMarketHoursRadar {
    const now = new Date(nowMs)
    const istParts = getTimePartsInTimezone(now, 'Asia/Kolkata')
    const istTimeDisplay = `${istParts.timeStr} IST`

    const markets: MarketSessionInfo[] = [
      this.getNSEStatus(now, istParts, istTimeDisplay),
      this.getBSEStatus(now, istParts, istTimeDisplay),
      this.getMCXStatus(now, istParts, istTimeDisplay),
      this.getUSMarketsStatus(now, istTimeDisplay),
      this.getLSEStatus(now, istTimeDisplay),
      this.getTSEStatus(now, istTimeDisplay),
      this.getCryptoStatus(now, istTimeDisplay),
    ]

    return {
      asOf: new Date(nowMs).toISOString(),
      userTimezone: 'Asia/Kolkata (IST)',
      markets,
    }
  }

  // 1. National Stock Exchange of India (NSE)
  private static getNSEStatus(now: Date, ist: TimeParts, istDisplay: string): MarketSessionInfo {
    const isWeekend = ist.day === 0 || ist.day === 6
    const curMinuteOfDay = ist.hour * 60 + ist.minute
    const curSecOfDay = curMinuteOfDay * 60 + ist.second

    let status: MarketSessionInfo['status'] = 'CLOSED'
    let statusBadge = '🔴 CLOSED'
    let statusDetail = 'Outside trading hours'
    let nextEvent = ''
    let countdownSec = 0

    if (isWeekend) {
      status = 'WEEKEND'
      statusBadge = '🏖️ WEEKEND (CLOSED)'
      statusDetail = 'Market closed for the weekend. Re-opens Monday 09:00 IST'
      // Days until Monday 09:00 IST
      const daysUntilMon = ist.day === 6 ? 2 : 1
      const targetSec = (daysUntilMon * 24 * 60 + 9 * 60) * 60
      countdownSec = targetSec - curSecOfDay
      nextEvent = `Pre-market opens Monday 09:00 IST (${formatCountdown(countdownSec)})`
    } else {
      const preOpenSec = 9 * 3600
      const regOpenSec = 9 * 3600 + 15 * 60
      const regCloseSec = 15 * 3600 + 30 * 60
      const postOpenSec = 15 * 3600 + 40 * 60
      const postCloseSec = 16 * 3600

      if (curSecOfDay < preOpenSec) {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Pre-market order collection begins at 09:00 IST'
        countdownSec = preOpenSec - curSecOfDay
        nextEvent = `Pre-market opens in ${formatCountdown(countdownSec)} (09:00 IST)`
      } else if (curSecOfDay < regOpenSec) {
        status = 'PRE_MARKET'
        statusBadge = '🟡 PRE-MARKET (ORDER DISCOVERY)'
        statusDetail = '09:00–09:08 Order entry/cancellation; 09:08–09:15 Order matching'
        countdownSec = regOpenSec - curSecOfDay
        nextEvent = `Continuous regular trading starts in ${formatCountdown(countdownSec)} (09:15 IST)`
      } else if (curSecOfDay < regCloseSec) {
        status = 'OPEN'
        statusBadge = '🟢 REGULAR SESSION (LIVE OPEN)'
        statusDetail = 'Continuous active trading in Equities & F&O derivatives'
        countdownSec = regCloseSec - curSecOfDay
        nextEvent = `Regular market closes in ${formatCountdown(countdownSec)} (15:30 IST)`
      } else if (curSecOfDay < postOpenSec) {
        status = 'CLOSED'
        statusBadge = '⏳ CLOSING BUFFER'
        statusDetail = 'Closing price calculation buffer period'
        countdownSec = postOpenSec - curSecOfDay
        nextEvent = `Post-market closing session starts in ${formatCountdown(countdownSec)} (15:40 IST)`
      } else if (curSecOfDay < postCloseSec) {
        status = 'AFTER_HOURS'
        statusBadge = '🟠 POST-MARKET CLOSING SESSION'
        statusDetail = 'Post-market trades at closing price'
        countdownSec = postCloseSec - curSecOfDay
        nextEvent = `Post-market ends in ${formatCountdown(countdownSec)} (16:00 IST)`
      } else {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Trading finished for today. Orders queued for next session'
        const nextDayPre = (24 * 3600 - curSecOfDay) + 9 * 3600
        const isFriday = ist.day === 5
        countdownSec = isFriday ? nextDayPre + 2 * 24 * 3600 : nextDayPre
        nextEvent = isFriday
          ? `Opens Monday at 09:00 IST (${formatCountdown(countdownSec)})`
          : `Opens tomorrow at 09:00 IST (${formatCountdown(countdownSec)})`
      }
    }

    return {
      id: 'nse',
      name: 'National Stock Exchange of India',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      timezone: 'Asia/Kolkata (IST, UTC+5:30)',
      status,
      statusBadge,
      statusDetail,
      currentLocalTime: istDisplay,
      currentISTTime: istDisplay,
      regularHoursLocal: '09:15 – 15:30 IST',
      regularHoursIST: '09:15 – 15:30 IST',
      preMarketHoursLocal: '09:00 – 09:15 IST',
      preMarketHoursIST: '09:00 – 09:15 IST',
      postMarketHoursLocal: '15:40 – 16:00 IST',
      postMarketHoursIST: '15:40 – 16:00 IST',
      nextEvent,
      nextEventCountdownSeconds: Math.max(0, countdownSec),
      workingDays: 'Monday – Friday (Excluding NSE National Holidays)',
      nonWorkingTimes: 'Weekends (Sat & Sun) + Daily 16:00 – 09:00 IST',
      notes: 'Muhurat Trading occurs during Diwali evening. Zero trade execution permitted on weekends/holidays.',
    }
  }

  // 2. Bombay Stock Exchange (BSE)
  private static getBSEStatus(now: Date, ist: TimeParts, istDisplay: string): MarketSessionInfo {
    const nse = this.getNSEStatus(now, ist, istDisplay)
    return {
      ...nse,
      id: 'bse',
      name: 'Bombay Stock Exchange',
      exchange: 'BSE (Sensex)',
      notes: 'BSE operates on the identical synchronized session schedule as NSE India.',
    }
  }

  // 3. Multi Commodity Exchange of India (MCX)
  private static getMCXStatus(now: Date, ist: TimeParts, istDisplay: string): MarketSessionInfo {
    const isWeekend = ist.day === 0 || ist.day === 6
    const curMinuteOfDay = ist.hour * 60 + ist.minute
    const curSecOfDay = curMinuteOfDay * 60 + ist.second

    let status: MarketSessionInfo['status'] = 'CLOSED'
    let statusBadge = '🔴 CLOSED'
    let statusDetail = 'Commodity trading halted'
    let nextEvent = ''
    let countdownSec = 0

    // MCX: Morning session: 09:00 - 17:00 IST; Evening session: 17:00 - 23:30 IST (Bullion & Energy)
    const openSec = 9 * 3600
    const eveningSec = 17 * 3600
    const closeSec = 23 * 3600 + 30 * 60

    if (isWeekend) {
      status = 'WEEKEND'
      statusBadge = '🏖️ WEEKEND (CLOSED)'
      statusDetail = 'MCX closed for weekend. Commodities reopen Monday 09:00 IST'
      const daysUntilMon = ist.day === 6 ? 2 : 1
      const targetSec = (daysUntilMon * 24 * 60 + 9 * 60) * 60
      countdownSec = targetSec - curSecOfDay
      nextEvent = `Morning session opens Monday 09:00 IST (${formatCountdown(countdownSec)})`
    } else {
      if (curSecOfDay < openSec) {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Pre-market preparation. Trading starts 09:00 IST'
        countdownSec = openSec - curSecOfDay
        nextEvent = `Morning session opens in ${formatCountdown(countdownSec)} (09:00 IST)`
      } else if (curSecOfDay < eveningSec) {
        status = 'OPEN'
        statusBadge = '🟢 MORNING SESSION (AGRI & METALS)'
        statusDetail = 'Continuous trading for both agricultural and non-agri commodities'
        countdownSec = eveningSec - curSecOfDay
        nextEvent = `Evening international session starts in ${formatCountdown(countdownSec)} (17:00 IST)`
      } else if (curSecOfDay < closeSec) {
        status = 'OPEN'
        statusBadge = '🟢 EVENING SESSION (GOLD, CRUDE, METALS)'
        statusDetail = 'High-liquidity international session aligned with US NYMEX/COMEX'
        countdownSec = closeSec - curSecOfDay
        nextEvent = `MCX market closes in ${formatCountdown(countdownSec)} (23:30 IST)`
      } else {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'MCX closed for night settlement'
        const nextDayOpen = (24 * 3600 - curSecOfDay) + 9 * 3600
        const isFriday = ist.day === 5
        countdownSec = isFriday ? nextDayOpen + 2 * 24 * 3600 : nextDayOpen
        nextEvent = isFriday
          ? `Opens Monday at 09:00 IST (${formatCountdown(countdownSec)})`
          : `Opens tomorrow at 09:00 IST (${formatCountdown(countdownSec)})`
      }
    }

    return {
      id: 'mcx',
      name: 'Multi Commodity Exchange of India',
      exchange: 'MCX',
      country: 'India',
      flag: '🇮🇳',
      timezone: 'Asia/Kolkata (IST, UTC+5:30)',
      status,
      statusBadge,
      statusDetail,
      currentLocalTime: istDisplay,
      currentISTTime: istDisplay,
      regularHoursLocal: 'Morning: 09:00 – 17:00 IST | Evening: 17:00 – 23:30 IST',
      regularHoursIST: 'Morning: 09:00 – 17:00 IST | Evening: 17:00 – 23:30 IST',
      nextEvent,
      nextEventCountdownSeconds: Math.max(0, countdownSec),
      workingDays: 'Monday – Friday',
      nonWorkingTimes: 'Weekends (Sat & Sun) + Daily 23:30 – 09:00 IST',
      notes: 'Evening session covers Gold, Silver, Crude Oil, Natural Gas, Copper. During US Daylight Saving Time, evening session extends to 23:55 IST.',
    }
  }

  // 4. US Stock Markets (NYSE & NASDAQ)
  private static getUSMarketsStatus(now: Date, istDisplay: string): MarketSessionInfo {
    const usParts = getTimePartsInTimezone(now, 'America/New_York')
    const isWeekend = usParts.day === 0 || usParts.day === 6
    const curSecOfDay = (usParts.hour * 60 + usParts.minute) * 60 + usParts.second

    let status: MarketSessionInfo['status'] = 'CLOSED'
    let statusBadge = '🔴 CLOSED'
    let statusDetail = 'US markets closed'
    let nextEvent = ''
    let countdownSec = 0

    const preOpenSec = 4 * 3600 // 04:00 EST
    const regOpenSec = 9 * 3600 + 30 * 60 // 09:30 EST
    const regCloseSec = 16 * 3600 // 16:00 EST
    const afterCloseSec = 20 * 3600 // 20:00 EST

    if (isWeekend) {
      status = 'WEEKEND'
      statusBadge = '🏖️ WEEKEND (CLOSED)'
      statusDetail = 'NYSE & NASDAQ closed for weekend'
      const daysUntilMon = usParts.day === 6 ? 2 : 1
      const targetSec = (daysUntilMon * 24 * 60 + 4 * 60) * 60
      countdownSec = targetSec - curSecOfDay
      nextEvent = `US Pre-Market opens Monday 04:00 EST (${formatCountdown(countdownSec)})`
    } else {
      if (curSecOfDay < preOpenSec) {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Overnight hold. Electronic pre-market begins at 04:00 EST'
        countdownSec = preOpenSec - curSecOfDay
        nextEvent = `Pre-Market opens in ${formatCountdown(countdownSec)} (04:00 EST / 14:30 IST)`
      } else if (curSecOfDay < regOpenSec) {
        status = 'PRE_MARKET'
        statusBadge = '🟡 US PRE-MARKET (LIVE)'
        statusDetail = 'Early institution and earnings positioning'
        countdownSec = regOpenSec - curSecOfDay
        nextEvent = `Wall Street Opening Bell in ${formatCountdown(countdownSec)} (09:30 EST / 20:00 IST)`
      } else if (curSecOfDay < regCloseSec) {
        status = 'OPEN'
        statusBadge = '🟢 US REGULAR SESSION (LIVE OPEN)'
        statusDetail = 'Full floor and electronic trading across NYSE & NASDAQ'
        countdownSec = regCloseSec - curSecOfDay
        nextEvent = `Wall Street Closing Bell in ${formatCountdown(countdownSec)} (16:00 EST / 02:30 IST)`
      } else if (curSecOfDay < afterCloseSec) {
        status = 'AFTER_HOURS'
        statusBadge = '🟠 US AFTER-HOURS SESSION'
        statusDetail = 'Post-earnings announcements & institutional clearing'
        countdownSec = afterCloseSec - curSecOfDay
        nextEvent = `After-hours closes in ${formatCountdown(countdownSec)} (20:00 EST / 06:30 IST)`
      } else {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Trading complete for today'
        const nextDayPre = (24 * 3600 - curSecOfDay) + 4 * 3600
        const isFriday = usParts.day === 5
        countdownSec = isFriday ? nextDayPre + 2 * 24 * 3600 : nextDayPre
        nextEvent = isFriday
          ? `Pre-market opens Monday 04:00 EST (${formatCountdown(countdownSec)})`
          : `Pre-market opens tomorrow 04:00 EST (${formatCountdown(countdownSec)})`
      }
    }

    return {
      id: 'nyse-nasdaq',
      name: 'New York Stock Exchange & NASDAQ',
      exchange: 'NYSE / NASDAQ',
      country: 'United States',
      flag: '🇺🇸',
      timezone: 'America/New_York (EST/EDT, UTC-5/UTC-4)',
      status,
      statusBadge,
      statusDetail,
      currentLocalTime: `${usParts.timeStr} EST/EDT`,
      currentISTTime: istDisplay,
      regularHoursLocal: '09:30 – 16:00 EST/EDT',
      regularHoursIST: '19:00 – 01:30 IST (EDT) / 20:00 – 02:30 IST (EST)',
      preMarketHoursLocal: '04:00 – 09:30 EST/EDT',
      preMarketHoursIST: '13:30 – 19:00 IST (EDT) / 14:30 – 20:00 IST (EST)',
      postMarketHoursLocal: '16:00 – 20:00 EST/EDT',
      postMarketHoursIST: '01:30 – 05:30 IST (EDT) / 02:30 – 06:30 IST (EST)',
      nextEvent,
      nextEventCountdownSeconds: Math.max(0, countdownSec),
      workingDays: 'Monday – Friday (Excluding US Federal Holidays)',
      nonWorkingTimes: 'Weekends (Sat & Sun) + Daily 20:00 – 04:00 EST',
      notes: 'Most active global equity trading volume occurs between 09:30 and 11:30 EST and 15:30 and 16:00 EST (Market on Close MOC orders).',
    }
  }

  // 5. London Stock Exchange (LSE)
  private static getLSEStatus(now: Date, istDisplay: string): MarketSessionInfo {
    const lseParts = getTimePartsInTimezone(now, 'Europe/London')
    const isWeekend = lseParts.day === 0 || lseParts.day === 6
    const curSecOfDay = (lseParts.hour * 60 + lseParts.minute) * 60 + lseParts.second

    let status: MarketSessionInfo['status'] = 'CLOSED'
    let statusBadge = '🔴 CLOSED'
    let statusDetail = 'London market closed'
    let nextEvent = ''
    let countdownSec = 0

    const openSec = 8 * 3600 // 08:00 London
    const closeSec = 16 * 3600 + 30 * 60 // 16:30 London

    if (isWeekend) {
      status = 'WEEKEND'
      statusBadge = '🏖️ WEEKEND (CLOSED)'
      statusDetail = 'LSE closed for weekend'
      const daysUntilMon = lseParts.day === 6 ? 2 : 1
      const targetSec = (daysUntilMon * 24 * 60 + 8 * 60) * 60
      countdownSec = targetSec - curSecOfDay
      nextEvent = `Opens Monday 08:00 London (${formatCountdown(countdownSec)})`
    } else {
      if (curSecOfDay < openSec) {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Pre-market order matching'
        countdownSec = openSec - curSecOfDay
        nextEvent = `LSE opens in ${formatCountdown(countdownSec)} (08:00 London / 13:30 IST)`
      } else if (curSecOfDay < closeSec) {
        status = 'OPEN'
        statusBadge = '🟢 LONDON REGULAR SESSION (LIVE OPEN)'
        statusDetail = 'FTSE 100 continuous trading session'
        countdownSec = closeSec - curSecOfDay
        nextEvent = `LSE closes in ${formatCountdown(countdownSec)} (16:30 London / 22:00 IST)`
      } else {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Session concluded'
        const nextDayOpen = (24 * 3600 - curSecOfDay) + 8 * 3600
        const isFriday = lseParts.day === 5
        countdownSec = isFriday ? nextDayOpen + 2 * 24 * 3600 : nextDayOpen
        nextEvent = isFriday
          ? `Opens Monday 08:00 London (${formatCountdown(countdownSec)})`
          : `Opens tomorrow 08:00 London (${formatCountdown(countdownSec)})`
      }
    }

    return {
      id: 'lse',
      name: 'London Stock Exchange',
      exchange: 'LSE (FTSE 100)',
      country: 'United Kingdom',
      flag: '🇬🇧',
      timezone: 'Europe/London (GMT/BST, UTC+0/UTC+1)',
      status,
      statusBadge,
      statusDetail,
      currentLocalTime: `${lseParts.timeStr} London`,
      currentISTTime: istDisplay,
      regularHoursLocal: '08:00 – 16:30 London Time',
      regularHoursIST: '13:30 – 22:00 IST (BST) / 14:30 – 23:00 IST (GMT)',
      nextEvent,
      nextEventCountdownSeconds: Math.max(0, countdownSec),
      workingDays: 'Monday – Friday',
      nonWorkingTimes: 'Weekends (Sat & Sun) + Daily 16:30 – 08:00 London Time',
      notes: 'Overlaps with US market open from 14:30 to 16:30 London time creating peak global liquidity.',
    }
  }

  // 6. Tokyo Stock Exchange (TSE)
  private static getTSEStatus(now: Date, istDisplay: string): MarketSessionInfo {
    const tseParts = getTimePartsInTimezone(now, 'Asia/Tokyo')
    const isWeekend = tseParts.day === 0 || tseParts.day === 6
    const curSecOfDay = (tseParts.hour * 60 + tseParts.minute) * 60 + tseParts.second

    let status: MarketSessionInfo['status'] = 'CLOSED'
    let statusBadge = '🔴 CLOSED'
    let statusDetail = 'Tokyo exchange closed'
    let nextEvent = ''
    let countdownSec = 0

    const morningOpenSec = 9 * 3600 // 09:00 JST
    const morningCloseSec = 11 * 3600 + 30 * 60 // 11:30 JST
    const afternoonOpenSec = 12 * 3600 + 30 * 60 // 12:30 JST
    const afternoonCloseSec = 15 * 3600 + 30 * 60 // 15:30 JST (Extended to 15:30 since late 2024)

    if (isWeekend) {
      status = 'WEEKEND'
      statusBadge = '🏖️ WEEKEND (CLOSED)'
      statusDetail = 'TSE closed for weekend'
      const daysUntilMon = tseParts.day === 6 ? 2 : 1
      const targetSec = (daysUntilMon * 24 * 60 + 9 * 60) * 60
      countdownSec = targetSec - curSecOfDay
      nextEvent = `Morning session opens Monday 09:00 JST (${formatCountdown(countdownSec)})`
    } else {
      if (curSecOfDay < morningOpenSec) {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Pre-market order matching'
        countdownSec = morningOpenSec - curSecOfDay
        nextEvent = `Tokyo Morning session opens in ${formatCountdown(countdownSec)} (09:00 JST / 05:30 IST)`
      } else if (curSecOfDay < morningCloseSec) {
        status = 'OPEN'
        statusBadge = '🟢 TOKYO MORNING SESSION (LIVE OPEN)'
        statusDetail = 'Nikkei 225 active morning session'
        countdownSec = morningCloseSec - curSecOfDay
        nextEvent = `Lunch break in ${formatCountdown(countdownSec)} (11:30 JST / 08:00 IST)`
      } else if (curSecOfDay < afternoonOpenSec) {
        status = 'LUNCH_BREAK'
        statusBadge = '☕ LUNCH BREAK (NON-WORKING)'
        statusDetail = 'Trading suspended during exchange lunch recess'
        countdownSec = afternoonOpenSec - curSecOfDay
        nextEvent = `Afternoon session resumes in ${formatCountdown(countdownSec)} (12:30 JST / 09:00 IST)`
      } else if (curSecOfDay < afternoonCloseSec) {
        status = 'OPEN'
        statusBadge = '🟢 TOKYO AFTERNOON SESSION (LIVE OPEN)'
        statusDetail = 'Nikkei 225 continuous afternoon session'
        countdownSec = afternoonCloseSec - curSecOfDay
        nextEvent = `TSE closes in ${formatCountdown(countdownSec)} (15:30 JST / 12:00 IST)`
      } else {
        status = 'CLOSED'
        statusBadge = '🔴 CLOSED'
        statusDetail = 'Tokyo trading closed for the day'
        const nextDayOpen = (24 * 3600 - curSecOfDay) + 9 * 3600
        const isFriday = tseParts.day === 5
        countdownSec = isFriday ? nextDayOpen + 2 * 24 * 3600 : nextDayOpen
        nextEvent = isFriday
          ? `Opens Monday 09:00 JST (${formatCountdown(countdownSec)})`
          : `Opens tomorrow 09:00 JST (${formatCountdown(countdownSec)})`
      }
    }

    return {
      id: 'tse',
      name: 'Tokyo Stock Exchange',
      exchange: 'TSE (Nikkei 225)',
      country: 'Japan',
      flag: '🇯🇵',
      timezone: 'Asia/Tokyo (JST, UTC+9)',
      status,
      statusBadge,
      statusDetail,
      currentLocalTime: `${tseParts.timeStr} JST`,
      currentISTTime: istDisplay,
      regularHoursLocal: 'Morning: 09:00 – 11:30 JST | Afternoon: 12:30 – 15:30 JST',
      regularHoursIST: 'Morning: 05:30 – 08:00 IST | Afternoon: 09:00 – 12:00 IST',
      nextEvent,
      nextEventCountdownSeconds: Math.max(0, countdownSec),
      workingDays: 'Monday – Friday',
      nonWorkingTimes: 'Lunch recess (11:30 – 12:30 JST) + Daily 15:30 – 09:00 JST + Weekends',
      notes: 'Tokyo Stock Exchange extended its afternoon closing bell by 30 minutes to 15:30 JST to boost liquidity.',
    }
  }

  // 7. Global Crypto Markets (24/7/365)
  private static getCryptoStatus(now: Date, istDisplay: string): MarketSessionInfo {
    return {
      id: 'crypto',
      name: 'Global Cryptocurrency Markets',
      exchange: 'Crypto (BTC / ETH / SOL)',
      country: 'Global / Decentralized',
      flag: '🌐',
      timezone: 'UTC (24/7/365)',
      status: 'OPEN',
      statusBadge: '🟢 24/7/365 ALWAYS LIVE OPEN',
      statusDetail: 'Continuous uninterrupted peer-to-peer liquidity and automated market making',
      currentLocalTime: `${new Date().toUTCString().slice(17, 25)} UTC`,
      currentISTTime: istDisplay,
      regularHoursLocal: '24 Hours / 7 Days a Week (Never Closes)',
      regularHoursIST: '24 Hours / 7 Days a Week (Never Closes)',
      nextEvent: 'Active Continuous Trading (Zero session halts or closing bells)',
      nextEventCountdownSeconds: 0,
      workingDays: 'Monday through Sunday (Every Single Day of the Year)',
      nonWorkingTimes: 'None! Zero holidays, zero lunch breaks, zero weekend closures.',
      notes: 'Peak volatility typically coincides with US and Asian market opens.',
    }
  }

  /**
   * Formats comprehensive market hours report into markdown context for the LLM
   */
  static formatMarketHoursContext(radar: GlobalMarketHoursRadar): string {
    const list = radar.markets
      .map((m) => {
        return `### ${m.flag} ${m.name} (${m.exchange}) — Status: ${m.statusBadge}
- Current Local Time: **${m.currentLocalTime}** | Current User Time: **${m.currentISTTime}**
- Working Days: ${m.workingDays}
- Working Hours (Local): ${m.regularHoursLocal}
- Working Hours (in User IST): **${m.regularHoursIST}**
${m.preMarketHoursIST ? `- Pre-Market (IST): ${m.preMarketHoursIST}\n` : ''}${m.postMarketHoursIST ? `- Post-Market (IST): ${m.postMarketHoursIST}\n` : ''}- Non-Working Times: ${m.nonWorkingTimes}
- Next Event: **${m.nextEvent}**
- Operational Notes: ${m.notes || 'Normal continuous operation.'}`
      })
      .join('\n\n')

    return `🏛️ GLOBAL MARKET SESSIONS, OPERATING & NON-OPERATING TIMINGS RADAR:
Current Time: ${new Date().toUTCString()} (User IST: ${radar.markets[0]?.currentISTTime || 'N/A'})

${list}

CRITICAL REPORTING DIRECTIVES:
1. When asked about market times, accurately state both the Local Market Time AND the Indian Standard Time (IST) conversion.
2. Clearly distinguish between WORKING times (Pre-market, Regular continuous trading, Post-market) and NON-WORKING times (Closed hours, Lunch breaks, Weekends, Holidays).
3. If user is in Stark Mode (Atlas), deliver with quant precision and tactical readiness for the upcoming opening bells!`
  }
}

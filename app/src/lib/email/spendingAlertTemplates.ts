interface SpendAlertData {
  cardName: string
  bank: string
  currentSpend: number
  requirement: number
  daysRemaining: number
  dailyNeeded: number
  deadline: string
  appUrl: string
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function progressBar(current: number, target: number) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return `
    <div style="background:#e2e8f0;height:10px;border-radius:5px;overflow:hidden;margin:12px 0;">
      <div style="background:linear-gradient(90deg,#10b981 0%,#059669 100%);height:100%;width:${pct}%;"></div>
    </div>
    <p style="font-size:13px;color:#718096;margin:0;">${fmtCurrency(current)} of ${fmtCurrency(target)} (${pct}%)</p>
  `
}

export function getPaceAlertEmail(data: SpendAlertData) {
  const remaining = data.requirement - data.currentSpend
  return {
    subject: `Pace alert: ${data.bank} ${data.cardName} is off track`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:28px;border-radius:10px;text-align:center;margin-bottom:24px;">
          <h1 style="color:white;margin:0;font-size:22px;">Pace Alert</h1>
        </div>
        <p>Your <strong>${data.bank} ${data.cardName}</strong> bonus spend is not on track to be completed before the deadline.</p>
        ${progressBar(data.currentSpend, data.requirement)}
        <div style="background:#fef3c7;border:1px solid #fde68a;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;font-size:15px;">You need to spend <strong>${fmtCurrency(data.dailyNeeded)}/day</strong> for the next <strong>${data.daysRemaining} days</strong> to reach ${fmtCurrency(data.requirement)} by ${data.deadline}.</p>
        </div>
        <a href="${data.appUrl}/tracker" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Tracker</a>
      </body></html>
    `,
    text: `Pace alert: ${data.bank} ${data.cardName} is off track. You've spent ${fmtCurrency(data.currentSpend)} of ${fmtCurrency(data.requirement)}. You need ${fmtCurrency(data.dailyNeeded)}/day for the next ${data.daysRemaining} days. Visit ${data.appUrl}/tracker`,
  }
}

export function get14DayWarningEmail(data: SpendAlertData) {
  const remaining = data.requirement - data.currentSpend
  return {
    subject: `14 days left: ${data.bank} ${data.cardName} spend deadline`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:28px;border-radius:10px;text-align:center;margin-bottom:24px;">
          <h1 style="color:white;margin:0;font-size:22px;">14 Days to Go</h1>
        </div>
        <p>Your <strong>${data.bank} ${data.cardName}</strong> bonus spend deadline is in <strong>14 days</strong> (${data.deadline}).</p>
        ${progressBar(data.currentSpend, data.requirement)}
        <p>You still need <strong>${fmtCurrency(remaining)}</strong>. That's <strong>${fmtCurrency(data.dailyNeeded)}/day</strong> to stay on track.</p>
        <a href="${data.appUrl}/tracker" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Tracker</a>
      </body></html>
    `,
    text: `14 days to go: ${data.bank} ${data.cardName} deadline is ${data.deadline}. ${fmtCurrency(remaining)} still needed. Visit ${data.appUrl}/tracker`,
  }
}

export function get3DayWarningEmail(data: SpendAlertData) {
  const remaining = data.requirement - data.currentSpend
  return {
    subject: `FINAL WARNING: ${data.bank} ${data.cardName} spend due in 3 days`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:28px;border-radius:10px;text-align:center;margin-bottom:24px;">
          <h1 style="color:white;margin:0;font-size:22px;">Final Warning — 3 Days Left</h1>
        </div>
        <p style="font-size:16px;">Your <strong>${data.bank} ${data.cardName}</strong> bonus spend deadline is in <strong>3 days</strong> (${data.deadline}).</p>
        ${progressBar(data.currentSpend, data.requirement)}
        <div style="background:#fee2e2;border:1px solid #fca5a5;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#dc2626;">You need to spend ${fmtCurrency(remaining)} in the next 3 days to earn the bonus.</p>
        </div>
        <a href="${data.appUrl}/tracker" style="display:inline-block;background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Tracker Now</a>
      </body></html>
    `,
    text: `FINAL WARNING: ${data.bank} ${data.cardName} deadline ${data.deadline}. ${fmtCurrency(remaining)} needed in 3 days. Visit ${data.appUrl}/tracker`,
  }
}

export function getCompletionEmail(data: SpendAlertData) {
  return {
    subject: `Bonus spend complete: ${data.bank} ${data.cardName}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:28px;border-radius:10px;text-align:center;margin-bottom:24px;">
          <h1 style="color:white;margin:0;font-size:22px;">Bonus Spend Complete!</h1>
        </div>
        <p style="font-size:16px;">Congratulations! You've met the minimum spend requirement for <strong>${data.bank} ${data.cardName}</strong>.</p>
        ${progressBar(data.currentSpend, data.requirement)}
        <p>You should receive your welcome bonus points within the timeframe stated in your card terms. Check your account to confirm receipt.</p>
        <a href="${data.appUrl}/tracker" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Tracker</a>
      </body></html>
    `,
    text: `Bonus spend complete! ${data.bank} ${data.cardName} requirement of ${fmtCurrency(data.requirement)} met. Visit ${data.appUrl}/tracker`,
  }
}

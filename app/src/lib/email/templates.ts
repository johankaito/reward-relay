interface ReminderEmailData {
  cardName: string;
  bank: string;
  cancellationDate: string;
  daysRemaining: number;
  currentSpend: number;
  spendTarget: number;
  appUrl: string;
}

export function get30DayReminderEmail(data: ReminderEmailData) {
  return {
    subject: `🗓️ 30 days until ${data.bank} ${data.cardName} cancellation`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cancellation Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Cancellation Reminder</h1>
          </div>

          <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #2d3748;">30 Days Until Cancellation</h2>
            <p style="font-size: 16px;">Your <strong>${data.bank} ${data.cardName}</strong> should be cancelled on:</p>
            <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 15px 0;">${data.cancellationDate}</p>
          </div>

          <div style="background: #fff; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #2d3748;">Spending Progress</h3>
            ${
              data.spendTarget > 0
                ? `
              <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>$${data.currentSpend.toLocaleString()}</span>
                  <span style="color: #718096;">$${data.spendTarget.toLocaleString()}</span>
                </div>
                <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${Math.min(
                    (data.currentSpend / data.spendTarget) * 100,
                    100
                  )}%;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 14px; color: #718096;">
                  ${
                    data.currentSpend >= data.spendTarget
                      ? "✅ Spending requirement met!"
                      : `$${(data.spendTarget - data.currentSpend).toLocaleString()} remaining`
                  }
                </p>
              </div>
            `
                : `<p style="color: #718096;">No spending requirement for this card.</p>`
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
          </div>

          <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
            <p>This reminder was sent by Reward Relay to help you maximize your churning strategy.</p>
            <p style="margin-top: 10px;">
              <a href="${data.appUrl}/calendar" style="color: #667eea; text-decoration: none;">View Calendar</a> •
              <a href="${data.appUrl}/spending" style="color: #667eea; text-decoration: none;">Track Spending</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
30 Days Until Cancellation

Your ${data.bank} ${data.cardName} should be cancelled on: ${data.cancellationDate}

Spending Progress:
${
  data.spendTarget > 0
    ? `$${data.currentSpend.toLocaleString()} / $${data.spendTarget.toLocaleString()}
${
  data.currentSpend >= data.spendTarget
    ? "✅ Spending requirement met!"
    : `$${(data.spendTarget - data.currentSpend).toLocaleString()} remaining`
}`
    : "No spending requirement for this card."
}

View your dashboard: ${data.appUrl}/dashboard
    `.trim(),
  };
}

export function get14DayReminderEmail(data: ReminderEmailData) {
  return {
    subject: `⚠️ 14 days until ${data.bank} ${data.cardName} cancellation`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Urgent Cancellation Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Urgent Reminder</h1>
          </div>

          <div style="background: #fff5f5; border: 2px solid #feb2b2; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #c53030;">Only 14 Days Left!</h2>
            <p style="font-size: 16px;">Your <strong>${data.bank} ${data.cardName}</strong> should be cancelled on:</p>
            <p style="font-size: 24px; font-weight: bold; color: #f5576c; margin: 15px 0;">${data.cancellationDate}</p>
          </div>

          <div style="background: #fff; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #2d3748;">Spending Progress</h3>
            ${
              data.spendTarget > 0
                ? `
              <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>$${data.currentSpend.toLocaleString()}</span>
                  <span style="color: #718096;">$${data.spendTarget.toLocaleString()}</span>
                </div>
                <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%); height: 100%; width: ${Math.min(
                    (data.currentSpend / data.spendTarget) * 100,
                    100
                  )}%;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 14px; ${
                  data.currentSpend >= data.spendTarget ? "color: #38a169;" : "color: #c53030;"
                }">
                  ${
                    data.currentSpend >= data.spendTarget
                      ? "✅ Spending requirement met!"
                      : `⚠️ $${(data.spendTarget - data.currentSpend).toLocaleString()} remaining - hurry!`
                  }
                </p>
              </div>
            `
                : `<p style="color: #718096;">No spending requirement for this card.</p>`
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
          </div>

          <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
            <p>This reminder was sent by Reward Relay to help you maximize your churning strategy.</p>
          </div>
        </body>
      </html>
    `,
    text: `
⚠️ Only 14 Days Left!

Your ${data.bank} ${data.cardName} should be cancelled on: ${data.cancellationDate}

Spending Progress:
${
  data.spendTarget > 0
    ? `$${data.currentSpend.toLocaleString()} / $${data.spendTarget.toLocaleString()}
${
  data.currentSpend >= data.spendTarget
    ? "✅ Spending requirement met!"
    : `⚠️ $${(data.spendTarget - data.currentSpend).toLocaleString()} remaining - hurry!`
}`
    : "No spending requirement for this card."
}

View your dashboard: ${data.appUrl}/dashboard
    `.trim(),
  };
}

export function get7DayReminderEmail(data: ReminderEmailData) {
  return {
    subject: `🚨 URGENT: 7 days until ${data.bank} ${data.cardName} cancellation!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Final Cancellation Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚨 FINAL REMINDER</h1>
          </div>

          <div style="background: #fff5f5; border: 3px solid #fc466b; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #c53030;">Only 7 Days Left!</h2>
            <p style="font-size: 16px;">Your <strong>${data.bank} ${data.cardName}</strong> should be cancelled on:</p>
            <p style="font-size: 28px; font-weight: bold; color: #fc466b; margin: 15px 0;">${data.cancellationDate}</p>
            <p style="font-size: 14px; color: #c53030;">⏰ Don't forget to cancel to avoid annual fees!</p>
          </div>

          <div style="background: #fff; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #2d3748;">Final Spending Check</h3>
            ${
              data.spendTarget > 0
                ? `
              <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>$${data.currentSpend.toLocaleString()}</span>
                  <span style="color: #718096;">$${data.spendTarget.toLocaleString()}</span>
                </div>
                <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #fc466b 0%, #3f5efb 100%); height: 100%; width: ${Math.min(
                    (data.currentSpend / data.spendTarget) * 100,
                    100
                  )}%;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 14px; font-weight: bold; ${
                  data.currentSpend >= data.spendTarget ? "color: #38a169;" : "color: #c53030;"
                }">
                  ${
                    data.currentSpend >= data.spendTarget
                      ? "✅ Great! Spending requirement met!"
                      : `🚨 $${(data.spendTarget - data.currentSpend).toLocaleString()} still needed! Act now!`
                  }
                </p>
              </div>
            `
                : `<p style="color: #718096;">No spending requirement for this card.</p>`
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Cancel Card Now</a>
          </div>

          <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
            <p>This is your final reminder from Reward Relay. Make sure to cancel before the deadline!</p>
          </div>
        </body>
      </html>
    `,
    text: `
🚨 FINAL REMINDER - Only 7 Days Left!

Your ${data.bank} ${data.cardName} should be cancelled on: ${data.cancellationDate}

⏰ Don't forget to cancel to avoid annual fees!

Final Spending Check:
${
  data.spendTarget > 0
    ? `$${data.currentSpend.toLocaleString()} / $${data.spendTarget.toLocaleString()}
${
  data.currentSpend >= data.spendTarget
    ? "✅ Great! Spending requirement met!"
    : `🚨 $${(data.spendTarget - data.currentSpend).toLocaleString()} still needed! Act now!`
}`
    : "No spending requirement for this card."
}

Cancel your card now: ${data.appUrl}/dashboard
    `.trim(),
  };
}
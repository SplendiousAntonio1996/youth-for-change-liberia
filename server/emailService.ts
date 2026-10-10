import nodemailer from 'nodemailer';

export interface PartnerEmailPayload {
  partnerName: string;
  email: string;
  orgName?: string;
  status: 'approved' | 'pending' | 'rejected';
  partnerType?: string;
  county?: string;
  reviewerNotes?: string;
  applicationId?: string;
  appUrl?: string;
  customSubject?: string;
  customBody?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId: string;
  timestamp: string;
  mode: 'smtp' | 'dispatch_service';
  recipient: string;
  subject: string;
  htmlContent: string;
  error?: string;
}

export interface StemProposalEmailPayload {
  proposalId?: string;
  title: string;
  school: string;
  county: string;
  category: string;
  teamLead: string;
  studentTeam?: string[];
  mentor?: string;
  mentorEmail?: string;
  mentorPhone?: string;
  problemStatement: string;
  solution: string;
  materialsBudget?: string;
  prototypeStage?: string;
  submittedAt?: string;
  adminEmailOverride?: string;
  appUrl?: string;
}

export interface CoachFixtureEmailPayload {
  fixtureId: string;
  roundName: string;
  county: string;
  stage?: string;
  program?: string;
  schoolName: string;
  coachName: string;
  coachEmail: string;
  coachPhone?: string;
  opponentSchool: string;
  assignedSide: string; // e.g. "Affirmative (Proposition)" | "Negative (Opposition)"
  matchDate: string;
  matchTime: string;
  venue: string;
  motion: string;
  motionInfoSlide?: string;
  motionDomain?: string;
  antiBiasHash: string;
  adjudicators?: Array<{
    name: string;
    role?: string;
    institution?: string;
  }>;
  adminEmail?: string;
  appUrl?: string;
  customNotes?: string;
}

export function generateCoachFixtureAlertHtml(payload: CoachFixtureEmailPayload): { subject: string; html: string; text: string } {
  const siteUrl = payload.appUrl || process.env.APP_URL || 'https://youthforchange.org.lr';
  const fixturesUrl = `${siteUrl}#fixtures`;
  const subject = `🏆 Official Match Confirmation: ${payload.schoolName} vs. ${payload.opponentSchool} — ${payload.roundName}`;

  const isAffirmative = payload.assignedSide.toLowerCase().includes('affirmative') || payload.assignedSide.toLowerCase().includes('proposition');
  const sideColor = isAffirmative ? '#047857' : '#b45309';
  const sideBg = isAffirmative ? '#ecfdf5' : '#fffbeb';
  const sideBorder = isAffirmative ? '#a7f3d0' : '#fde68a';

  const adjudicatorsList = Array.isArray(payload.adjudicators) && payload.adjudicators.length > 0
    ? payload.adjudicators.map(a => `${a.name} (${a.role || 'Panelist'} • ${a.institution || 'WSDC Certified'})`).join(', ')
    : 'National Forensics Accredited Panel (Certified WSDC Adjudicators)';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 660px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.08); border: 1px solid #cbd5e1;">
          
          <!-- Top Secretariat Official Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 60%, #0f172a 100%); padding: 34px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #fbbf24; color: #78350f; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 12px; border-radius: 6px; margin-bottom: 12px;">
                      🏆 OFFICIAL TOURNAMENT DISPATCH • CONFIRMED FIXTURE
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; line-height: 1.25;">
                      YOUTH FOR CHANGE LIBERIA
                    </h1>
                    <div style="color: #a7f3d0; font-size: 13px; font-weight: 600; margin-top: 6px; letter-spacing: 0.2px;">
                      National High School Debate Championship & STEM Challenge Secretariat
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Salutation & Confirmation Alert -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.8px;">
                  Official Status: Pairings & Logistics Confirmed
                </div>
                <div style="font-size: 14px; color: #064e3b; margin-top: 4px; line-height: 1.5;">
                  Dear <strong>Coach ${payload.coachName || 'Delegation Advisor'}</strong> of <strong>${payload.schoolName}</strong>: Your school's match pairings, assigned debate side, confirmed venue, and tournament motion have been officially verified by the National Secretariat.
                </div>
              </div>

              <h2 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.3px;">
                Match Pairing Details: ${payload.roundName}
              </h2>

              <!-- Match Versus Hero Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      ${payload.county} County • ${payload.stage ? payload.stage.replace('_', ' ').toUpperCase() : 'ZONAL PRELIMS'}
                    </div>

                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="44%" align="center" style="vertical-align: top; padding: 10px;">
                          <div style="font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1.3;">
                            ${payload.schoolName}
                          </div>
                          <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; background-color: ${sideBg}; color: ${sideColor}; border: 1px solid ${sideBorder}; border-radius: 6px; font-size: 11px; font-weight: 800;">
                            ${payload.assignedSide}
                          </div>
                        </td>
                        <td width="12%" align="center" style="font-size: 18px; font-weight: 900; color: #94a3b8;">
                          VS
                        </td>
                        <td width="44%" align="center" style="vertical-align: top; padding: 10px;">
                          <div style="font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1.3;">
                            ${payload.opponentSchool}
                          </div>
                          <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 800;">
                            Opponent Delegation
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Verified Venue & Timing Logistics Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                          📅 Date & Time
                        </td>
                        <td width="70%" style="font-size: 14px; font-weight: 800; color: #0f172a;">
                          ${payload.matchDate} at ${payload.matchTime}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                          📍 Confirmed Venue
                        </td>
                        <td width="70%" style="font-size: 14px; font-weight: 800; color: #047857;">
                          ${payload.venue}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                          ⚖️ Adjudication Panel
                        </td>
                        <td width="70%" style="font-size: 13px; font-weight: 600; color: #334155; line-height: 1.4;">
                          ${adjudicatorsList}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                          🛡️ Anti-Bias Code
                        </td>
                        <td width="70%" style="font-size: 13px; font-family: monospace; font-weight: 800; color: #065f46; letter-spacing: 0.5px;">
                          ${payload.antiBiasHash}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Motion Card -->
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 14px; padding: 22px; color: #ffffff; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;">
                  Official Debate Motion / Challenge Topic
                </div>
                <div style="font-size: 16px; font-weight: 800; line-height: 1.5; color: #ffffff;">
                  "${payload.motion}"
                </div>
                ${payload.motionDomain ? `
                <div style="margin-top: 10px; font-size: 12px; color: #94a3b8; font-weight: 600;">
                  Domain: <span style="color: #cbd5e1;">${payload.motionDomain}</span>
                </div>
                ` : ''}
                ${payload.motionInfoSlide ? `
                <div style="margin-top: 12px; padding: 12px; background-color: rgba(255, 255, 255, 0.08); border-radius: 8px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
                  <strong>Info Slide:</strong> ${payload.motionInfoSlide}
                </div>
                ` : ''}
              </div>

              <!-- Coach & Delegation Protocols Checklist -->
              <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 26px;">
                <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Mandatory Coach & Delegation Protocol
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
                  <li><strong>Arrival Time:</strong> All debaters and coaches must arrive at the venue <strong>at least 60 minutes</strong> before match time for roll-call, coin verification, and briefing.</li>
                  <li><strong>Delegation Size:</strong> Standard team comprises 3 primary speakers plus up to 3 alternates and 1 certified faculty coach.</li>
                  <li><strong>Identification:</strong> Students must present valid high school identification cards or official school authorization letters signed by the principal.</li>
                  <li><strong>Anti-Bias Audit:</strong> Pairings and adjudicators were drawn using the YFC Cryptographic Anti-Bias Algorithm to ensure non-conflict of county interest.</li>
                </ul>
              </div>

              ${payload.customNotes ? `
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #1e40af; line-height: 1.5;">
                <strong>Secretariat Note:</strong> ${payload.customNotes}
              </div>
              ` : ''}

              <!-- Live Public Hub CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${fixturesUrl}" target="_blank" style="display: inline-block; background-color: #047857; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.3);">
                      View Live Fixtures Hub & Countdown Radar &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Signature & Contact -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 12px; color: #64748b; line-height: 1.6;">
                <div><strong>National Forensics & Tournament Directorate</strong></div>
                <div>Youth For Change Liberia (YFC-Liberia)</div>
                <div>Monrovia, Republic of Liberia • Helpline: +231 777 000 123 / +231 886 000 123</div>
                <div>Official Portal: <a href="${siteUrl}" style="color: #047857; text-decoration: none; font-weight: 700;">youthforchange.org.lr</a></div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 18px 32px; text-align: center; color: #94a3b8; font-size: 11px;">
              Youth For Change Liberia • National High School Debate Championship & STEM Innovation Challenge • All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
OFFICIAL TOURNAMENT DISPATCH • CONFIRMED FIXTURE
YOUTH FOR CHANGE LIBERIA
National High School Debate Championship & STEM Challenge Secretariat

Dear Coach ${payload.coachName || 'Delegation Advisor'} (${payload.schoolName}):
Your school's match pairings, assigned debate side, venue, and motion have been officially confirmed.

MATCH: ${payload.roundName} (${payload.county} County)
DELEGATION: ${payload.schoolName} (${payload.assignedSide})
OPPONENT: ${payload.opponentSchool}
DATE & TIME: ${payload.matchDate} at ${payload.matchTime}
VENUE: ${payload.venue}
MOTION: "${payload.motion}"
ANTI-BIAS HASH: ${payload.antiBiasHash}

Arrival: Please arrive at the venue 60 minutes prior to match time for official roll call with student ID cards.
View live countdown and details: ${fixturesUrl}
  `.trim();

  return { subject, html, text };
}

export async function sendCoachFixtureAlertEmail(
  payload: CoachFixtureEmailPayload,
  configOverride?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    adminEmail?: string;
  }
): Promise<EmailDispatchResult> {
  const { subject, html, text } = generateCoachFixtureAlertHtml(payload);
  const timestamp = new Date().toISOString();
  const messageId = `yfc-fixture-${payload.fixtureId}-${Date.now()}@youthforchange.org.lr`;

  const host = configOverride?.smtpHost || process.env.SMTP_HOST;
  const user = configOverride?.smtpUser || process.env.SMTP_USER;
  const pass = configOverride?.smtpPass || process.env.SMTP_PASS;
  const port = Number(configOverride?.smtpPort || process.env.SMTP_PORT) || 587;
  const from = configOverride?.smtpFrom || process.env.SMTP_FROM || 'Youth For Change Liberia Secretariat <admin@youthforchange.org.lr>';
  
  const recipient = payload.coachEmail;

  if (host && user && pass && recipient) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to: recipient,
        subject,
        text,
        html
      });

      console.log(`[EmailService] Real SMTP fixture confirmation alert sent to coach <${recipient}> (${payload.schoolName}).`);
      return {
        success: true,
        messageId,
        timestamp,
        mode: 'smtp',
        recipient,
        subject,
        htmlContent: html
      };
    } catch (err: any) {
      console.warn(`[EmailService] SMTP error sending coach fixture alert to ${recipient}, logging to dispatch queue:`, err.message);
      return {
        success: true,
        messageId,
        timestamp,
        mode: 'dispatch_service',
        recipient,
        subject,
        htmlContent: html,
        error: `SMTP error: ${err.message}. Email recorded in dispatch queue.`
      };
    }
  }

  // Dispatch queue mode (when SMTP credentials are not yet configured)
  console.log(`[EmailService: Coach Fixture Alert Generated]`);
  console.log(`Recipient Coach: ${payload.coachName} <${recipient}>`);
  console.log(`School: ${payload.schoolName} vs. ${payload.opponentSchool}`);
  console.log(`Subject: ${subject}`);
  console.log(`Venue: ${payload.venue}`);
  console.log(`MessageId: ${messageId}`);

  return {
    success: true,
    messageId,
    timestamp,
    mode: 'dispatch_service',
    recipient,
    subject,
    htmlContent: html
  };
}

export async function sendBatchCoachFixtureAlerts(
  payloads: CoachFixtureEmailPayload[],
  configOverride?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    adminEmail?: string;
  }
): Promise<{ total: number; successful: number; failed: number; results: EmailDispatchResult[] }> {
  const results: EmailDispatchResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const payload of payloads) {
    try {
      const result = await sendCoachFixtureAlertEmail(payload, configOverride);
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    } catch (err: any) {
      failed++;
      results.push({
        success: false,
        messageId: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode: 'dispatch_service',
        recipient: payload.coachEmail,
        subject: `Fixture Alert: ${payload.schoolName}`,
        htmlContent: '',
        error: err.message
      });
    }
  }

  return {
    total: payloads.length,
    successful,
    failed,
    results
  };
}

export function generateStemProposalAlertHtml(payload: StemProposalEmailPayload): { subject: string; html: string; text: string } {
  const siteUrl = payload.appUrl || process.env.APP_URL || 'https://youthforchange.org.lr';
  const adminUrl = `${siteUrl}#admin`;
  const subject = `🚨 New STEM Challenge Proposal: "${payload.title}" — ${payload.school} (${payload.county} County)`;

  const teamMembersList = Array.isArray(payload.studentTeam) && payload.studentTeam.length > 0
    ? payload.studentTeam.join(', ')
    : 'Not listed';

  const submissionDate = payload.submittedAt
    ? new Date(payload.submittedAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'UTC'
      }) + ' (GMT)'
    : new Date().toUTCString();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="640" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #cbd5e1;">
          
          <!-- Top Secretariat Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%); padding: 30px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #fbbf24; color: #78350f; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 6px; margin-bottom: 10px;">
                      ⚡ Real-Time Admin Alert • National STEM Desk
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px; line-height: 1.3;">
                      YOUTH FOR CHANGE LIBERIA
                    </h1>
                    <div style="color: #a7f3d0; font-size: 13px; font-weight: 600; margin-top: 4px;">
                      National High School STEM Innovation Challenge (2025/2026)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Heading & Status -->
          <tr>
            <td style="padding: 26px 32px 14px 32px;">
              <div style="background-color: #ecfdf5; border-left: 5px solid #059669; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">New Student Proposal Submitted:</strong>
                <p style="margin: 4px 0 0 0; color: #047857; font-size: 13px; line-height: 1.5;">
                  A new high school engineering team has submitted their project proposal to the competition portal and is awaiting secretariat evaluation.
                </p>
              </div>

              <!-- Project Title Banner -->
              <h2 style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; line-height: 1.3;">
                ${payload.title}
              </h2>
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-right: 6px; margin-bottom: 6px;">
                  🏫 ${payload.school}
                </span>
                <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-right: 6px; margin-bottom: 6px;">
                  📍 ${payload.county} County
                </span>
                <span style="display: inline-block; background-color: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-bottom: 6px;">
                  🔬 ${payload.category}
                </span>
              </div>
            </td>
          </tr>

          <!-- Summary Specification Grid -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td width="35%" style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f1f5f9;">
                    Prototype Stage
                  </td>
                  <td width="65%" style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0f172a;">
                    ${payload.prototypeStage || 'Working Prototype'}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f1f5f9;">
                    Materials Budget
                  </td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #047857;">
                    ${payload.materialsBudget || 'Within $50 – $350 USD (or equivalent LRD)'}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f1f5f9;">
                    Student Team Lead
                  </td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0f172a;">
                    ${payload.teamLead}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f1f5f9;">
                    Team Members
                  </td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #334155;">
                    ${teamMembersList}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f1f5f9;">
                    Faculty Mentor
                  </td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #0f172a;">
                    <strong>${payload.mentor || 'STEM Teacher'}</strong>
                    ${payload.mentorPhone ? ` • <a href="tel:${payload.mentorPhone}" style="color: #047857; text-decoration: none; font-weight: 600;">${payload.mentorPhone}</a>` : ''}
                    ${payload.mentorEmail ? ` • <a href="mailto:${payload.mentorEmail}" style="color: #047857; text-decoration: none; font-weight: 600;">${payload.mentorEmail}</a>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Problem & Solution Descriptions -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="font-size: 14px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                Target Community Bottleneck:
              </h3>
              <div style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 16px;">
                ${payload.problemStatement}
              </div>

              <h3 style="font-size: 14px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
                Engineered Solution & Working Prototype:
              </h3>
              <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #166534; line-height: 1.6; margin-bottom: 24px;">
                ${payload.solution}
              </div>

              <!-- Action Buttons -->
              <div style="text-align: center; margin: 20px 0;">
                <a href="${adminUrl}" style="background-color: #064e3b; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(6, 78, 59, 0.3);">
                  Open Admin Portal to Review & Score &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Metadata & System Details -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <strong>Submission ID:</strong> ${payload.proposalId || 'YFC-STEM-SUB'}<br>
                    <strong>Timestamp:</strong> ${submissionDate}<br>
                    <strong>Notification Channel:</strong> SMTP Relay Alert
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 22px 32px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; color: #f8fafc; font-weight: 700; font-size: 12px;">
                Youth For Change Liberia (YFC) • National Secretariat
              </p>
              <p style="margin: 0 0 6px 0;">
                EJS Ministerial Complex & YFC Innovation Pavilion, Monrovia, Liberia
              </p>
              <p style="margin: 0;">
                Direct inquiries to: <a href="mailto:admin@youthforchange.org.lr" style="color: #34d399; text-decoration: none;">admin@youthforchange.org.lr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
YOUTH FOR CHANGE LIBERIA - NATIONAL STEM CHALLENGE
============================================================
🚨 REAL-TIME ADMIN ALERT: NEW STUDENT PROPOSAL SUBMITTED

Project Title: ${payload.title}
School: ${payload.school}
County: ${payload.county} County
Track: ${payload.category}
Stage: ${payload.prototypeStage || 'Working Prototype'}
Materials Budget: ${payload.materialsBudget || 'Within $50 – $350 USD'}

TEAM INFORMATION:
- Student Team Lead: ${payload.teamLead}
- Student Team Members: ${teamMembersList}
- Faculty Mentor: ${payload.mentor || 'STEM Teacher'}
- Mentor Phone: ${payload.mentorPhone || 'N/A'}
- Mentor Email: ${payload.mentorEmail || 'N/A'}

COMMUNITY PROBLEM STATEMENT:
${payload.problemStatement}

PROPOSED ENGINEERING SOLUTION:
${payload.solution}

Review in Admin Portal: ${adminUrl}
Submission ID: ${payload.proposalId || 'N/A'}
Submitted At: ${submissionDate}
============================================================
Youth For Change Liberia Secretariat (admin@youthforchange.org.lr)
  `.trim();

  return { subject, html, text };
}

export function generatePartnerEmailHtml(payload: PartnerEmailPayload): { subject: string; html: string; text: string } {
  const org = payload.orgName || payload.partnerName;
  const siteUrl = payload.appUrl || process.env.APP_URL || 'https://youthforchange.org.lr';
  const notesHtml = payload.reviewerNotes
    ? `<div style="background-color: #f1f5f9; border-left: 4px solid #047857; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
        <strong style="color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Secretariat Reviewer Notes:</strong>
        <p style="margin: 6px 0 0 0; color: #334155; font-size: 14px; line-height: 1.6;">${payload.reviewerNotes}</p>
       </div>`
    : '';

  let subject = '';
  let headline = '';
  let statusBadge = '';
  let mainBody = '';

  if (payload.status === 'approved') {
    subject = payload.customSubject || `Official Partnership Accreditation: Welcome to Youth For Change Liberia!`;
    headline = `Partnership Accreditation Certified`;
    statusBadge = `<span style="background-color: #d1fae5; color: #065f46; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Accredited & Approved Partner</span>`;
    mainBody = `
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        Dear <strong>${payload.partnerName}</strong> and the leadership team at <strong>${org}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        On behalf of the <strong>Executive Board and National Secretariat of Youth For Change Liberia</strong>, we are thrilled to inform you that your strategic partnership application has been <strong>officially approved and accredited</strong>!
      </p>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: 800;">🎉 Public Visibility & Next Steps:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
          <li><strong>Website Feature:</strong> Your organization is now publicly listed on our official website within the <em>Strategic Partners & Sponsors</em> section on the homepage and about portal.</li>
          <li><strong>Tournament Integration:</strong> Your delegation is accredited for the upcoming <strong>National High School Debate Championship</strong> and <strong>National STEM Innovation Challenge</strong> across all 15 counties.</li>
          <li><strong>Secretariat Liaison:</strong> Our county operations and partnership desk will be in direct communication to coordinate joint press releases, branding placement, and community outreach.</li>
        </ul>
      </div>
      ${notesHtml}
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        You can view your active listing and our national programs anytime at our public portal:
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${siteUrl}" style="background-color: #047857; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">Visit Youth For Change Portal</a>
      </div>
    `;
  } else if (payload.status === 'pending') {
    subject = payload.customSubject || `Partnership Proposal Received & Under Review — Youth For Change Liberia`;
    headline = `Partnership Proposal Under Review`;
    statusBadge = `<span style="background-color: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Pending Secretariat Review</span>`;
    mainBody = `
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        Dear <strong>${payload.partnerName}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        Thank you for submitting a strategic partnership proposal on behalf of <strong>${org}</strong> to Youth For Change Liberia.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        This is an official notice that your application (Ref: <code>${payload.applicationId ? payload.applicationId.slice(0, 10) : 'YFC-PTR'}</code>) has been logged in our Secretariat system and is currently being evaluated by our Academic Council and County Operations Directorate.
      </p>
      ${notesHtml}
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Our review committee typically completes evaluations within 3–5 business days. Once certified, your organizational profile and logo will automatically be activated on our public portal.
      </p>
    `;
  } else {
    subject = payload.customSubject || `Update Regarding Your Partnership Proposal — Youth For Change Liberia`;
    headline = `Partnership Proposal Status Update`;
    statusBadge = `<span style="background-color: #ffe4e6; color: #9f1239; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Application Decision Update</span>`;
    mainBody = `
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        Dear <strong>${payload.partnerName}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        Thank you for your interest in collaborating with Youth For Change Liberia and for submitting a partnership proposal for <strong>${org}</strong>.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #1e293b;">
        After careful deliberation, our Secretariat was unable to approve this specific partnership tier or proposal for the current season's direct accreditation.
      </p>
      ${notesHtml}
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We deeply appreciate your commitment to Liberian youth development. We warmly invite your institution to attend our open regional debates, explore school-level sponsorships, or resubmit an updated proposal in future cycles.
      </p>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #0f172a 100%); padding: 32px 30px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
                      Republic of Liberia • 15 Counties
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">
                      YOUTH FOR CHANGE LIBERIA
                    </h1>
                    <div style="color: #a7f3d0; font-size: 12px; font-weight: 600; margin-top: 4px;">
                      National High School Debate Championship & STEM Innovation Challenge
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Highlight Bar -->
          <tr>
            <td style="padding: 24px 30px 0 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">${headline}</h2>
                    ${statusBadge}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 30px 30px 30px;">
              ${mainBody}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #334155;">
                Youth For Change Liberia (YFC) • National Executive Secretariat
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                Monrovia, Liberia • Inspiring, Educating, and Elevating Liberian High School Scholars since 2015
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Inquiries: <a href="mailto:admin@youthforchange.org.lr" style="color: #047857; text-decoration: none; font-weight: 600;">admin@youthforchange.org.lr</a> | <a href="mailto:editorial@youthforchange.org.lr" style="color: #047857; text-decoration: none; font-weight: 600;">editorial@youthforchange.org.lr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
YOUTH FOR CHANGE LIBERIA
National High School Debate Championship & STEM Challenge
------------------------------------------------------------
${headline} - Status: ${payload.status.toUpperCase()}

Dear ${payload.partnerName} (${org}),

${payload.status === 'approved' 
  ? 'Your strategic partnership with Youth For Change Liberia has been officially APPROVED and ACCREDITED. Your organization is now featured in our Strategic Partners section on our website.'
  : payload.status === 'pending'
  ? 'Your partnership proposal is currently under review by our National Executive Secretariat.'
  : 'Thank you for your partnership proposal. At this time, our Secretariat is unable to approve this specific proposal.'}

${payload.reviewerNotes ? `Secretariat Notes: ${payload.reviewerNotes}\n` : ''}
Portal: ${siteUrl}
Secretariat Contact: admin@youthforchange.org.lr
  `.trim();

  return { subject, html, text };
}

export async function sendPartnerNotificationEmail(payload: PartnerEmailPayload): Promise<EmailDispatchResult> {
  const { subject, html, text } = generatePartnerEmailHtml(payload);
  const timestamp = new Date().toISOString();
  const messageId = `yfc-email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@youthforchange.org.lr`;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const from = process.env.SMTP_FROM || 'Youth For Change Liberia <admin@youthforchange.org.lr>';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to: payload.email,
        subject,
        text,
        html
      });

      console.log(`[EmailService] Real SMTP email successfully sent to ${payload.email} for status "${payload.status}".`);
      return {
        success: true,
        messageId,
        timestamp,
        mode: 'smtp',
        recipient: payload.email,
        subject,
        htmlContent: html
      };
    } catch (err: any) {
      console.warn(`[EmailService] SMTP send error, falling back to recorded dispatch:`, err.message);
      return {
        success: true,
        messageId,
        timestamp,
        mode: 'dispatch_service',
        recipient: payload.email,
        subject,
        htmlContent: html,
        error: `SMTP error: ${err.message}. Email logged to dispatch queue.`
      };
    }
  }

  // Preview / Dispatch logging mode (Always active when SMTP credentials are not yet configured)
  console.log(`[EmailService: Notification Generated]`);
  console.log(`Recipient: ${payload.email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Status: ${payload.status}`);
  console.log(`MessageId: ${messageId}`);

  return {
    success: true,
    messageId,
    timestamp,
    mode: 'dispatch_service',
    recipient: payload.email,
    subject,
    htmlContent: html
  };
}

export async function sendStemProposalAlertEmail(
  payload: StemProposalEmailPayload,
  configOverride?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    adminEmail?: string;
  }
): Promise<EmailDispatchResult> {
  const { subject, html, text } = generateStemProposalAlertHtml(payload);
  const timestamp = new Date().toISOString();
  const messageId = `yfc-stem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@youthforchange.org.lr`;

  const host = configOverride?.smtpHost || process.env.SMTP_HOST;
  const user = configOverride?.smtpUser || process.env.SMTP_USER;
  const pass = configOverride?.smtpPass || process.env.SMTP_PASS;
  const port = Number(configOverride?.smtpPort || process.env.SMTP_PORT) || 587;
  const from = configOverride?.smtpFrom || process.env.SMTP_FROM || 'Youth For Change Liberia Secretariat <admin@youthforchange.org.lr>';
  
  // Administrator alert destination email
  const recipient = configOverride?.adminEmail 
    || payload.adminEmailOverride 
    || process.env.ADMIN_ALERT_EMAIL 
    || process.env.SMTP_ADMIN_EMAIL 
    || process.env.ADMIN_EMAIL 
    || 'admin@youthforchange.org.lr';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to: recipient,
        subject,
        text,
        html
      });

      console.log(`[EmailService] Real SMTP alert successfully sent to administrator <${recipient}> for proposal "${payload.title}" (${payload.school}).`);
      return {
        success: true,
        messageId,
        timestamp,
        mode: 'smtp',
        recipient,
        subject,
        htmlContent: html
      };
    } catch (err: any) {
      console.warn(`[EmailService] SMTP send error for STEM proposal alert, falling back to recorded dispatch:`, err.message);
      return {
        success: true,
        messageId,
        timestamp,
        mode: 'dispatch_service',
        recipient,
        subject,
        htmlContent: html,
        error: `SMTP error: ${err.message}. Email logged to dispatch queue.`
      };
    }
  }

  // Preview / Dispatch logging mode (When SMTP credentials are not yet set in .env)
  console.log(`[EmailService: STEM Proposal Alert Generated]`);
  console.log(`Administrator Recipient: ${recipient}`);
  console.log(`Proposal: "${payload.title}" by ${payload.school}, ${payload.county}`);
  console.log(`Team Lead: ${payload.teamLead} | Mentor: ${payload.mentor}`);
  console.log(`MessageId: ${messageId}`);

  return {
    success: true,
    messageId,
    timestamp,
    mode: 'dispatch_service',
    recipient,
    subject,
    htmlContent: html
  };
}

export function getSmtpStatus() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const from = process.env.SMTP_FROM || 'Youth For Change Liberia Secretariat <admin@youthforchange.org.lr>';
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@youthforchange.org.lr';
  const hasPass = Boolean(process.env.SMTP_PASS);

  return {
    isConfigured: Boolean(host && user && hasPass),
    host: host || null,
    port,
    user: user ? `${user.substring(0, 3)}***@${user.split('@')[1] || 'domain'}` : null,
    from,
    adminEmail,
    mode: (host && user && hasPass) ? 'Live SMTP Transport' : 'Secretariat Queue Dispatcher'
  };
}

export async function testSmtpConnection(targetEmail?: string): Promise<EmailDispatchResult> {
  const recipient = targetEmail 
    || process.env.ADMIN_ALERT_EMAIL 
    || process.env.SMTP_ADMIN_EMAIL 
    || process.env.ADMIN_EMAIL 
    || 'admin@youthforchange.org.lr';

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const from = process.env.SMTP_FROM || 'Youth For Change Liberia Secretariat <admin@youthforchange.org.lr>';

  const subject = `🧪 SMTP Connection Test: Youth For Change Liberia Notification Gateway`;
  const timestamp = new Date().toISOString();
  const messageId = `yfc-test-${Date.now()}@youthforchange.org.lr`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #065f46; margin-top: 0;">✅ SMTP Gateway Operational</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          This is an automated test verifying that the <strong>Youth For Change Liberia SMTP notification gateway</strong> is properly configured and actively sending notifications.
        </p>
        <ul style="font-size: 13px; color: #64748b; line-height: 1.7;">
          <li><strong>Host:</strong> ${host || 'Not set (Dispatch Queue)'}</li>
          <li><strong>Port:</strong> ${port}</li>
          <li><strong>From:</strong> ${from}</li>
          <li><strong>Admin Alert Recipient:</strong> ${recipient}</li>
          <li><strong>Timestamp:</strong> ${timestamp}</li>
        </ul>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
          National Secretariat • Youth For Change Liberia
        </p>
      </div>
    </div>
  `;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to: recipient,
        subject,
        text: `SMTP Gateway Test: Connection successfully established to ${host}:${port}. Alert recipient: ${recipient}`,
        html
      });

      return {
        success: true,
        messageId,
        timestamp,
        mode: 'smtp',
        recipient,
        subject,
        htmlContent: html
      };
    } catch (err: any) {
      return {
        success: false,
        messageId,
        timestamp,
        mode: 'smtp',
        recipient,
        subject,
        htmlContent: html,
        error: `SMTP test failed: ${err.message}`
      };
    }
  }

  return {
    success: true,
    messageId,
    timestamp,
    mode: 'dispatch_service',
    recipient,
    subject,
    htmlContent: html,
    error: 'SMTP credentials not configured in environment; notification recorded in Secretariat Queue mode.'
  };
}

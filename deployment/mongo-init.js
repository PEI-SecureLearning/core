// Initialize MongoDB with an application user and seed templates

db = db.getSiblingDB('securelearning');

db.createUser({
  user: 'template_user',
  pwd: 'template_pass',
  roles: [
    { role: 'readWrite', db: 'securelearning' }
  ]
});

db.templates.insertMany([
  {
    name: "Payroll Update",
    path: "/templates/emails/",
    subject: "Important: Payroll information needs your confirmation",
    category: "Finance",
    description: "Classic payroll lure with CTA to update details.",
    html: `
<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
    <h2 style="color:#7c3aed;">Payroll Confirmation Required</h2>
    <p>We are updating our payroll system. Please verify your payment details by the end of day.</p>
    <a href="{{ phishing_link }}" style="display:inline-block;padding:12px 16px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;">Verify now</a>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you already verified, you can ignore this message.</p>
  </body>
</html>`,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    name: "Cloud Storage Share",
    path: "/templates/pages/",
    subject: "You have been granted access to a shared document",
    category: "Collaboration",
    description: "Drive/SharePoint style share notification.",
    html: `
<!doctype html>
<html>
  <body style="font-family:Helvetica,Arial,sans-serif;max-width:640px;margin:auto;">
    <p><strong>{{ sender_name }}</strong> shared a document with you.</p>
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px 0;">Document: <strong>Quarterly_Numbers.xlsx</strong></p>
      <p style="margin:0;color:#6b7280;">Last modified: Today</p>
    </div>
    <a href="{{ phishing_link }}" style="background:#10b981;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;">Open in Drive</a>
  </body>
</html>`,
    created_at: new Date(),
    updated_at: new Date(),
  }
]);

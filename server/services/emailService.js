const nodemailer = require('nodemailer');

// Create transporter - configure via environment variables
const createTransporter = () => {
  // If SMTP is configured, use it; otherwise use a test account
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback: Use a test account (for development)
  // In production, you should configure SMTP settings
  console.warn('SMTP not configured. Email notifications will not be sent.');
  return null;
};

const transporter = createTransporter();

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content (optional)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log('Email not sent (SMTP not configured):', { to, subject });
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@schooladmin.nl';
    
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification when a new comment is added to a ticket
 */
const sendCommentNotification = async (ticket, comment, commenter, recipients) => {
  const ticketUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    : `Ticket #${ticket.id}`;

  const subject = `New comment on ticket #${ticket.id}: ${ticket.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
        .comment-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #d1d5db; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Comment on Ticket</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${commenter.email}</strong> (${commenter.role}) has added a new comment to ticket <strong>#${ticket.id}</strong>.</p>
          
          <div class="ticket-info">
            <h3 style="margin-top: 0;">${ticket.title}</h3>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
          </div>
          
          <div class="comment-box">
            <p><strong>Comment:</strong></p>
            <p>${comment.content.replace(/\n/g, '<br>')}</p>
          </div>
          
          ${process.env.FRONTEND_URL ? `<a href="${ticketUrl}" class="button">View Ticket</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification from the School Admin system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailAddresses = recipients.map(r => r.email).filter(Boolean);
  if (emailAddresses.length === 0) {
    return { success: false, message: 'No valid email addresses' };
  }

  return await sendEmail({
    to: emailAddresses,
    subject,
    html,
  });
};

/**
 * Send notification when ticket assignee changes
 */
const sendAssigneeChangeNotification = async (ticket, oldAssignee, newAssignee, changedBy) => {
  const ticketUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    : `Ticket #${ticket.id}`;

  const recipients = [];
  if (oldAssignee && oldAssignee.email) recipients.push(oldAssignee);
  if (newAssignee && newAssignee.email) recipients.push(newAssignee);
  if (changedBy && changedBy.email && !recipients.find(r => r.email === changedBy.email)) {
    recipients.push(changedBy);
  }

  const subject = `Ticket #${ticket.id} assignee changed: ${ticket.title}`;
  
  const oldAssigneeName = oldAssignee ? `${oldAssignee.email} (${oldAssignee.role})` : 'Unassigned';
  const newAssigneeName = newAssignee ? `${newAssignee.email} (${newAssignee.role})` : 'Unassigned';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
        .change-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #d1d5db; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Ticket Assignee Changed</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The assignee for ticket <strong>#${ticket.id}</strong> has been changed by <strong>${changedBy.email}</strong> (${changedBy.role}).</p>
          
          <div class="ticket-info">
            <h3 style="margin-top: 0;">${ticket.title}</h3>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
          </div>
          
          <div class="change-box">
            <p><strong>Assignee Change:</strong></p>
            <p><strong>From:</strong> ${oldAssigneeName}</p>
            <p><strong>To:</strong> ${newAssigneeName}</p>
          </div>
          
          ${process.env.FRONTEND_URL ? `<a href="${ticketUrl}" class="button">View Ticket</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification from the School Admin system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailAddresses = recipients.map(r => r.email).filter(Boolean);
  if (emailAddresses.length === 0) {
    return { success: false, message: 'No valid email addresses' };
  }

  return await sendEmail({
    to: emailAddresses,
    subject,
    html,
  });
};

/**
 * Send notification when ticket status changes
 */
const sendStatusChangeNotification = async (ticket, oldStatus, newStatus, changedBy) => {
  const ticketUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    : `Ticket #${ticket.id}`;

  // Get all relevant users: creator, assignee, and changer
  const recipients = [];
  if (ticket.created_by_user && ticket.created_by_user.email) {
    recipients.push(ticket.created_by_user);
  }
  if (ticket.assigned_to_user && ticket.assigned_to_user.email) {
    recipients.push(ticket.assigned_to_user);
  }
  if (changedBy && changedBy.email && !recipients.find(r => r.email === changedBy.email)) {
    recipients.push(changedBy);
  }

  const subject = `Ticket #${ticket.id} status changed: ${ticket.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
        .change-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #d1d5db; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
        .status-open { background-color: #fef3c7; color: #92400e; }
        .status-in_progress { background-color: #dbeafe; color: #1e40af; }
        .status-resolved { background-color: #d1fae5; color: #065f46; }
        .status-closed { background-color: #e5e7eb; color: #374151; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Ticket Status Changed</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The status for ticket <strong>#${ticket.id}</strong> has been changed by <strong>${changedBy.email}</strong> (${changedBy.role}).</p>
          
          <div class="ticket-info">
            <h3 style="margin-top: 0;">${ticket.title}</h3>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            ${ticket.assigned_to_user ? `<p><strong>Assigned to:</strong> ${ticket.assigned_to_user.email}</p>` : ''}
          </div>
          
          <div class="change-box">
            <p><strong>Status Change:</strong></p>
            <p><strong>From:</strong> <span class="status-badge status-${oldStatus}">${oldStatus}</span></p>
            <p><strong>To:</strong> <span class="status-badge status-${newStatus}">${newStatus}</span></p>
          </div>
          
          ${process.env.FRONTEND_URL ? `<a href="${ticketUrl}" class="button">View Ticket</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification from the School Admin system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailAddresses = recipients.map(r => r.email).filter(Boolean);
  if (emailAddresses.length === 0) {
    return { success: false, message: 'No valid email addresses' };
  }

  return await sendEmail({
    to: emailAddresses,
    subject,
    html,
  });
};

module.exports = {
  sendEmail,
  sendCommentNotification,
  sendAssigneeChangeNotification,
  sendStatusChangeNotification,
};


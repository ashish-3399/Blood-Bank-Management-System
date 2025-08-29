import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendBloodRequestNotification = async (request) => {
  const subject = `New Blood Request - ${request.bloodType} (${request.urgency} priority)`;
  const html = `
    <h2>New Blood Request Received</h2>
    <p><strong>Patient:</strong> ${request.patientName}</p>
    <p><strong>Blood Type:</strong> ${request.bloodType}</p>
    <p><strong>Units Needed:</strong> ${request.unitsNeeded}</p>
    <p><strong>Urgency:</strong> ${request.urgency}</p>
    <p><strong>Hospital:</strong> ${request.hospitalName}</p>
    <p><strong>Required Date:</strong> ${new Date(request.requiredDate).toLocaleDateString()}</p>
    <p><strong>Medical Reason:</strong> ${request.medicalReason}</p>
  `;

  // Send to all admins (you would fetch admin emails from database)
  // This is a simplified version
  await sendEmail('admin@bloodbank.com', subject, html);
};
const { prisma } = require('../../prisma/connection');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

exports.get_users = async (req, res) => {
	try {
		const users = await prisma.user.findMany();
		res.status(200).json(users);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: 'Internal Server Error'
		});
	}
};

exports.get_user = async (req, res) => {
	res.status(200).json(req.user);
};

exports.update_enrollment = async (req, res) => {
  const { student_id } = req.params;
  const { enrollment_status } = req.body;

  try {
    // 1. Update student enrollment status
    const student = await prisma.student.update({
      where: { id: parseInt(student_id) },
      data: { enrollment_status },
    });

    // 2. Generate PDF
    const pdfPath = path.join(__dirname, `enrollment_${student.id}.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));

    doc.fontSize(20).text('Enrollment Confirmation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Student Name: ${student.first_name} ${student.last_name}`);
    doc.text(`Enrollment Status: ${student.enrollment_status ? 'Active' : 'Inactive'}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    doc.end();

    // 3. Setup email transport (configure SMTP for your service)
    const transporter = nodemailer.createTransport({
		host: "live.smtp.mailtrap.io",
		port: 587,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
    });

    // 4. Send email with PDF attachment
    await transporter.sendMail({
      from: '"School Admin" <smtp@mailtrap.io>',
      to: student.parent_email, // sending to parent
      subject: 'Enrollment Status Update',
      text: `Dear ${student.parent_name},\n\nYour child’s enrollment status has been updated.`,
      attachments: [
        {
          filename: `enrollment_${student.id}.pdf`,
          path: pdfPath,
        },
      ],
    });

    // 5. Respond
    res.status(200).json({
      message: 'Enrollment status updated and email sent successfully',
      student,
    });

    // Optional: delete PDF after sending
    fs.unlinkSync(pdfPath);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};
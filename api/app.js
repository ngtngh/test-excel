const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const Dropbox = require('dropbox').Dropbox;
const fetch = require('node-fetch');
const excel = require('exceljs');

const app = express();

// Sử dụng body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Đường dẫn đến file JSON
const STUDENTS_FILE = 'students.json';

// Cấu hình Dropbox
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN; // Lấy Access Token từ biến môi trường
const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch: fetch });

// Tạo file Excel trong Dropbox nếu chưa tồn tại
async function createExcelFile() {
    try {
        const response = await dbx.filesListFolder({ path: '' });
        const files = response.entries;

        if (!files.some(file => file.name === 'students.xlsx')) {
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('students');

            worksheet.columns = [
                { header: 'Thời gian', key: 'time', width: 20, style: { alignment: { horizontal: 'center' } } },
                { header: 'Mã sinh viên', key: 'student_id', width: 15, style: { alignment: { horizontal: 'center' } } },
                { header: 'Họ và tên', key: 'name', width: 25 },
                { header: 'Ngày sinh', key: 'birthdate', width: 15, style: { alignment: { horizontal: 'center' } } },
                { header: 'Điểm số', key: 'score', width: 10, style: { alignment: { horizontal: 'center' } } }
            ];

            worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

            const buffer = await workbook.xlsx.writeBuffer();
            await dbx.filesUpload({ path: '/students.xlsx', contents: buffer, mode: 'add' });

            console.log('File Excel created successfully in Dropbox.');
        }
    } catch (error) {
        console.error('Error creating Excel file in Dropbox:', error);
    }
}

// Kiểm tra và tạo file Excel khi server khởi động
createExcelFile();

app.post('/', async (req, res) => {
    const currentTime = moment().format('DD/MM/YYYY HH:mm:ss');
    const student_id = req.body.student_id;
    const name = req.body.name;
    const birthdate = req.body.birthdate;
    const score = req.body.score;

    try {
        const response = await dbx.filesDownload({ path: '/students.xlsx' });
        const buffer = response.fileBinary;
        const workbook = new excel.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet('students');

        worksheet.columns = [
            { header: 'Thời gian', key: 'time', width: 20, style: { alignment: { horizontal: 'center' } } },
            { header: 'Mã sinh viên', key: 'student_id', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Họ và tên', key: 'name', width: 25 },
            { header: 'Ngày sinh', key: 'birthdate', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Điểm số', key: 'score', width: 10, style: { alignment: { horizontal: 'center' } } }
        ];

        worksheet.addRow({ time: currentTime, student_id, name, birthdate, score });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(4).alignment = { horizontal: 'center' };
                row.getCell(5).alignment = { horizontal: 'center' };
            }
        });

        const updatedBuffer = await workbook.xlsx.writeBuffer();
        await dbx.filesUpload({ path: '/students.xlsx', contents: updatedBuffer, mode: 'overwrite' });

        res.redirect('/');
    } catch (error) {
        console.error('Error reading or writing the Excel file in Dropbox:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/form.html');
});

app.use(express.static(__dirname));

app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});

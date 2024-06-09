// Hàm để lấy danh sách sinh viên từ server
async function fetchStudents() {
    const response = await fetch('/students');
    const students = await response.json();
    return students;
}

// Hàm để tự động điền thông tin khi nhập mã sinh viên
async function autofillStudentInfo() {
    const studentIdInput = document.getElementById('student_id');
    const studentId = studentIdInput.value;
    const students = await fetchStudents();

    const student = students.find(s => s.student_id === studentId);

    const nameElem = document.getElementById('name');
    const birthdateElem = document.getElementById('birthdate');
    const scoreElem = document.getElementById('score');
    const hiddenName = document.getElementById('hidden_name');
    const hiddenBirthdate = document.getElementById('hidden_birthdate');
    const hiddenScore = document.getElementById('hidden_score');
    const submitBtn = document.getElementById('submitBtn');

    if (student) {
        nameElem.textContent = student.name;
        birthdateElem.textContent = student.birthdate;
        scoreElem.textContent = student.score;

        hiddenName.value = student.name;
        hiddenBirthdate.value = student.birthdate;
        hiddenScore.value = student.score;

        submitBtn.disabled = false;
    } else {
        nameElem.textContent = '';
        birthdateElem.textContent = '';
        scoreElem.textContent = '';

        hiddenName.value = '';
        hiddenBirthdate.value = '';
        hiddenScore.value = '';

        submitBtn.disabled = true;
    }
}

// Hàm xử lý gửi form
function handleSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('studentForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');

    // Gửi dữ liệu
    fetch(form.action, {
        method: form.method,
        body: new URLSearchParams(new FormData(form)),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        if (response.ok) {
            // Đặt lại form và ẩn nút gửi
            form.reset();
            document.getElementById('name').textContent = '';
            document.getElementById('birthdate').textContent = '';
            document.getElementById('score').textContent = '';
            submitBtn.style.display = 'none';
            successMessage.style.display = 'block';

            // Hiển thị nút gửi lại sau 2 giây
            setTimeout(() => {
                successMessage.style.display = 'none';
                submitBtn.style.display = 'block';
                submitBtn.disabled = true;
            }, 2000);
        } else {
            console.error('Submit failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// import { useEffect, useState } from 'react';
// import  studentAPI from '../apis/students/studentAPI';
import { useAuth } from '@/hooks/useAuth';

const StudentsPage = () => {
  const { user } = useAuth();
  console.log(user);
  //   const [students, setStudents] = useState([]);

  //   const get_students = async () => {
  //     const response = await studentAPI.get_students();
  //     return response.data;
  //   };

  return (
    <div>
      <h1>Leerlingen</h1>
      <div>
        {/* {students.map((student) => (
          <div key={student.id}>{student.name}</div>
        ))} */}
        {user ? (
          <div>
            <div>ID: {user.id}</div>
            <div>Email: {user.email}</div>
            <div>Rol: {user.role}</div>
            {/* Or to inspect the full object: */}
            {/* <pre className="mt-2 text-sm">{JSON.stringify(user, null, 2)}</pre> */}
          </div>
        ) : (
          <div>Geen gebruiker ingelogd</div>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;

import RequestHandler from './RequestHandler';

export const get_results = async () => {
  // Temporary mock data for testing the UI
  // TODO: Replace with actual API call when backend is ready
  const mockData = [
    {
      id: 1,
      student_id: 1,
      subject_id: 1,
      grade: 8.5,
      date: '2024-01-15',
      student: {
        first_name: 'Emma',
        last_name: 'van der Berg',
      },
      subject: {
        name: 'Wiskunde',
      },
    },
    {
      id: 2,
      student_id: 2,
      subject_id: 2,
      grade: 7.2,
      date: '2024-01-14',
      student: {
        first_name: 'Liam',
        last_name: 'de Jong',
      },
      subject: {
        name: 'Nederlands',
      },
    },
    {
      id: 3,
      student_id: 3,
      subject_id: 3,
      grade: 9.1,
      date: '2024-01-13',
      student: {
        first_name: 'Sophie',
        last_name: 'Janssen',
      },
      subject: {
        name: 'Engels',
      },
    },
    {
      id: 4,
      student_id: 1,
      subject_id: 4,
      grade: 6.8,
      date: '2024-01-12',
      student: {
        first_name: 'Emma',
        last_name: 'van der Berg',
      },
      subject: {
        name: 'Geschiedenis',
      },
    },
    {
      id: 5,
      student_id: 4,
      subject_id: 1,
      grade: 5.4,
      date: '2024-01-11',
      student: {
        first_name: 'Noah',
        last_name: 'Bakker',
      },
      subject: {
        name: 'Wiskunde',
      },
    },
    {
      id: 6,
      student_id: 2,
      subject_id: 5,
      grade: 8.7,
      date: '2024-01-10',
      student: {
        first_name: 'Liam',
        last_name: 'de Jong',
      },
      subject: {
        name: 'Biologie',
      },
    },
    {
      id: 7,
      student_id: 5,
      subject_id: 2,
      grade: 7.9,
      date: '2024-01-09',
      student: {
        first_name: 'Olivia',
        last_name: 'Smit',
      },
      subject: {
        name: 'Nederlands',
      },
    },
    {
      id: 8,
      student_id: 3,
      subject_id: 6,
      grade: 6.1,
      date: '2024-01-08',
      student: {
        first_name: 'Sophie',
        last_name: 'Janssen',
      },
      subject: {
        name: 'Scheikunde',
      },
    },
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockData;

  // Original API call (commented out for now)
  // const { data } = await RequestHandler.get('/general/results');
  // return data;
};

export const add_result = async (resultData) => {
  const response = await RequestHandler.post('/general/results', resultData);
  return response.data;
};

export const update_result = async (resultData) => {
  const { data } = await RequestHandler.put(
    `/general/results/${resultData.id}`,
    resultData
  );
  return data;
};

export const delete_result = async (resultId) => {
  await RequestHandler.del(`/general/results/${resultId}`);
  return resultId;
};

const resultAPI = {
  get_results,
  add_result,
  update_result,
  delete_result,
};

export default resultAPI;
